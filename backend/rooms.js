const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function createRoom(hostId, hostName) {
  const code = generateCode();
  rooms[code] = {
    hostId,
    phase: "lobby",
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        alive: true,
        role: null,
      },
    },
  };
  return code;
}

function joinRoom(code, id, name) {
  if (!rooms[code] || rooms[code].phase !== "lobby") return false;
  rooms[code].players[id] = {
    id,
    name,
    alive: true,
    role: null,
  };
  return true;
}

function startGame(code) {
  const room = rooms[code];
  if (!room || room.phase !== "lobby") return false;

  const playerIds = Object.keys(room.players);
  const grinchIndex = Math.floor(Math.random() * playerIds.length);
  const grinchId = playerIds[grinchIndex];

  playerIds.forEach((id) => {
    room.players[id].role = id === grinchId ? "grinch" : "elf";
  });

  room.phase = "action";
  room.tasks = {
    total: Object.keys(room.players).length * 2,
    completed: 0,
  };

  return true;
}

function setPhase(code, phase) {
  const room = rooms[code];
  if (!room) return;
  room.phase = phase;
}

module.exports = {
  rooms,
  createRoom,
  joinRoom,
  startGame,
  setPhase,
};
