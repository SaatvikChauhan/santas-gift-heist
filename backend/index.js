const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { startGame, createRoom, joinRoom, rooms } = require("./rooms");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const sabotageCooldowns = new Map();
const MAX_ROUNDS = 3;

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("create-room", ({ name }) => {
    const roomCode = createRoom(socket.id, name);
    socket.join(roomCode);
    socket.emit("room-created", { roomCode });
    io.to(roomCode).emit("room-update", rooms[roomCode]);
  });

  socket.on("join-room", ({ roomCode, name }) => {
    const success = joinRoom(roomCode, socket.id, name);
    if (!success) return socket.emit("join-error");

    socket.join(roomCode);
    io.to(roomCode).emit("room-update", rooms[roomCode]);
  });

  socket.on("leave-room", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const leavingPlayer = room.players[socket.id];
    if (!leavingPlayer) return;

    if (socket.id === room.hostId) {
      io.to(roomCode).emit("game-over", { winner: "none" });
      delete rooms[roomCode];
      return;
    }

    delete room.players[socket.id];
    socket.leave(roomCode);
    io.to(roomCode).emit("room-update", room);
  });

  socket.on("rejoin-room", ({ roomCode, name }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const existingPlayer = Object.values(room.players).find(
      (p) => p.name === name
    );

    if (existingPlayer) {
      const oldId = existingPlayer.id;

      delete room.players[oldId];

      existingPlayer.id = socket.id;
      room.players[socket.id] = existingPlayer;

      if (room.hostId === oldId) {
        room.hostId = socket.id;
      }

      socket.join(roomCode);
      socket.emit("role-assigned", { role: existingPlayer.role });
      io.to(roomCode).emit("room-update", room);
    }
  });

  socket.on("start-game", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || socket.id !== room.hostId) return;

    startGame(roomCode);

    room.phase = "action";
    room.round = 1;

    Object.values(room.players).forEach((p) =>
      io.to(p.id).emit("role-assigned", { role: p.role })
    );

    io.to(roomCode).emit("room-update", room);
    startPhaseTimer(roomCode);
  });

  function startPhaseTimer(roomCode) {
    const room = rooms[roomCode];
    if (!room || room.phase === "game-over") return;

    let duration =
      room.phase === "action"
        ? 60
        : room.phase === "discussion-voting"
        ? 30
        : 0;

    let remaining = duration;

    const interval = setInterval(() => {
      remaining--;
      io.to(roomCode).emit("timer-update", remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        advancePhase(roomCode);
      }
    }, 1000);
  }

  function advancePhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    if (room.phase === "action") {
      room.phase = "discussion-voting";
      room.votes = {};
      io.to(roomCode).emit("room-update", room);
      startPhaseTimer(roomCode);
      return;
    }

    if (room.phase === "discussion-voting") {
      resolveVoting(roomCode);
    }
  }

  function resolveVoting(roomCode) {
    const room = rooms[roomCode];
    if (!room || !room.votes) return;

    console.log(room.votes);
    const tally = {};

    Object.values(room.votes).forEach((targetId) => {
      tally[targetId] = (tally[targetId] || 0) + 1;
    });

    let votedOutId = null;
    let maxVotes = 0;

    for (const [id, count] of Object.entries(tally)) {
      if (count > maxVotes) {
        maxVotes = count;
        votedOutId = id;
      }
    }

    if (!votedOutId) {
      room.phase = "action";
      room.round++;
      if (room.round > MAX_ROUNDS) {
        room.phase = "game-over";
        io.to(roomCode).emit("game-over", { winner: "grinch" });
        return;
      }

      io.to(roomCode).emit("room-update", room);
      startPhaseTimer(roomCode);
      return;
    }

    const votedPlayer = room.players[votedOutId];

    if (votedPlayer.role === "grinch") {
      room.phase = "game-over";
      io.to(roomCode).emit("game-over", { winner: "elves" });
      return;
    }

    delete room.players[votedOutId];

    const remainingPlayers = Object.values(room.players);

    if (
      remainingPlayers.length === 1 &&
      remainingPlayers[0].role === "grinch"
    ) {
      room.phase = "game-over";
      io.to(roomCode).emit("room-update", room);
      io.to(roomCode).emit("game-over", { winner: "grinch" });
      return;
    }

    room.phase = "action";
    room.round++;

    if (room.round > MAX_ROUNDS) {
      room.phase = "game-over";
      io.to(roomCode).emit("room-update", room);
      io.to(roomCode).emit("game-over", { winner: "grinch" });
      return;
    }

    io.to(roomCode).emit("room-update", room);
    startPhaseTimer(roomCode);
  }

  socket.on("cast-vote", ({ roomCode, targetId }) => {
    const room = rooms[roomCode];
    if (!room || room.phase !== "discussion-voting") return;
    room.votes[socket.id] = targetId;

    io.to(roomCode).emit("room-update", room);
  });

  socket.on("send-chat", ({ roomCode, message }) => {
    const room = rooms[roomCode];
    const player = room?.players[socket.id];
    if (!room || !player) return;

    io.to(roomCode).emit("chat-message", {
      name: player.name,
      message,
    });
  });

  socket.on("complete-task", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.phase !== "action") return;

    const player = room.players[socket.id];
    if (!player || player.role !== "elf") return;

    room.tasks.completed += 1;

    if (room.tasks.completed >= room.tasks.total) {
      room.phase = "game-over";
      io.to(roomCode).emit("room-update", room);
      io.to(roomCode).emit("game-over", { winner: "elves" });
      return;
    }

    io.to(roomCode).emit("room-update", room);
  });

  socket.on("trigger-sabotage", ({ roomCode, task }) => {
    const room = rooms[roomCode];
    const player = room?.players[socket.id];
    if (!player || player.role !== "grinch") return;

    const now = Date.now();
    const COOLDOWN = 10_000;

    if (now - (sabotageCooldowns.get(socket.id) || 0) < COOLDOWN) return;
    sabotageCooldowns.set(socket.id, now);

    Object.values(room.players).forEach((p) => {
      if (p.id !== socket.id) {
        io.to(p.id).emit("sabotage", { task, id: now });
      }
    });
  });
});

server.listen(4000, () => console.log("🎅 Server running on port 4000"));
