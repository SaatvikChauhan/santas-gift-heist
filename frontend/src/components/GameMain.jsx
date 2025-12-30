import Task1 from "./Task1";
import Task2 from "./Task2";
import Task3 from "./Task3";
import { socket } from "../socket";
import { useState } from "react";

export default function GameMain({
  room,
  role,
  timer,
  activeTask,
  setActiveTask,
  sabotage,
  grinchCooldown,
  handleTaskComplete,
  triggerSabotage,
  chatInput,
  setChatInput,
  messages,
  sendMessage,
  roomCode,
  isEliminated,
  playClick,
}) {
  const taskProgress = room.tasks
    ? (room.tasks.completed / room.tasks.total) * 100
    : 0;

  const hoverSfx = new Audio("/music/hoversfx.mp3");
  hoverSfx.volume = 0.2;
  const playHover = () => {
    hoverSfx.currentTime = 0;
    hoverSfx.playbackRate = 0.95 + Math.random() * 0.1;
    hoverSfx.play().catch(() => {});
  };

  const [selectedVote, setSelectedVote] = useState(null);

  return (
    <main className={`game-main-container ${role}-theme`}>
      {isEliminated && (
        <div className="eliminated-overlay">
          <div className="overlay-content">
            <h2>☠️ OUT OF THE WORKSHOP</h2>
            <p>You are now a Christmas Spirit (Spectator)</p>
            <div className="spectator-stats">
              <span>Phase: {room.phase.toUpperCase()}</span>
              <span>Time: {timer}s</span>
            </div>
          </div>
        </div>
      )}

      {room.tasks && room.phase !== "lobby" && !activeTask && (
        <section className="status-hud">
          <span className="round-counter">ROUND {room.round} / 3</span>
          <div className="progress-container">
            <div className="progress-label">
              <span>WORKSHOP QUOTA</span>
              <span>
                {room.tasks.completed} / {room.tasks.total}
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${taskProgress}%` }}
              >
                <div className="progress-shimmer"></div>
              </div>
            </div>
          </div>
          <div className={`phase-tag ${room.phase}`}>
            {room.phase.replace("-", " ").toUpperCase()}
          </div>
        </section>
      )}

      {room.phase === "action" && role === "grinch" && !isEliminated && (
        <section className="action-panel grinch-ui">
          <div className="role-header">
            <h2 className="glitch-text" data-text="SABOTAGE CHRISTMAS">
              SABOTAGE CHRISTMAS
            </h2>
            <p>Stop the Elves. Stay hidden.</p>
          </div>
          <div className="ability-grid">
            <div
              className={`ability-card ${
                grinchCooldown > 0 ? "on-cooldown" : ""
              }`}
            >
              <button
                disabled={grinchCooldown > 0}
                onClick={() => {
                  playClick();
                  triggerSabotage("gift");
                }}
                onMouseEnter={() => playHover()}
              >
                <span className="icon">🎁</span>
                <span className="label">Shuffle Gifts</span>
              </button>
            </div>
            <div
              className={`ability-card ${
                grinchCooldown > 0 ? "on-cooldown" : ""
              }`}
            >
              <button
                disabled={grinchCooldown > 0}
                onClick={() => {
                  playClick();
                  triggerSabotage("memory");
                }}
                onMouseEnter={() => playHover()}
              >
                <span className="icon">🔔</span>
                <span className="label">Swap Memory Icons</span>
              </button>
            </div>
            <div
              className={`ability-card ${
                grinchCooldown > 0 ? "on-cooldown" : ""
              }`}
            >
              <button
                disabled={grinchCooldown > 0}
                onClick={() => {
                  playClick();
                  triggerSabotage("reindeer");
                }}
                onMouseEnter={() => playHover()}
              >
                <span className="icon">🦌</span>
                <span className="label">Freeze Sliders</span>
              </button>
            </div>
          </div>
          {grinchCooldown > 0 && (
            <div className="global-cooldown-bar">
              <div
                className="cooldown-fill"
                style={{ width: `${(grinchCooldown / 10) * 100}%` }}
              ></div>
            </div>
          )}
        </section>
      )}

      {room.phase === "action" &&
        role === "elf" &&
        !activeTask &&
        !isEliminated && (
          <section className="action-panel elf-ui">
            <div className="role-header">
              <h2>WORKSHOP DUTY</h2>
              <p>Complete tasks to save Christmas!</p>
            </div>
            <div className="task-mission-grid">
              <button
                className="task-card"
                onClick={() => {
                  playClick();
                  setActiveTask("gift");
                }}
                onMouseEnter={() => playHover()}
              >
                <div className="task-icon">🎁</div>
                <div className="task-info">
                  <h3>Chaotic Gift Sorting</h3>
                </div>
              </button>
              <button
                className="task-card"
                onClick={() => {
                  playClick();
                  setActiveTask("memory");
                }}
                onMouseEnter={() => playHover()}
              >
                <div className="task-icon">🔔</div>
                <div className="task-info">
                  <h3>Carol Memory Mayhem</h3>
                </div>
              </button>
              <button
                className="task-card"
                onClick={() => {
                  playClick();
                  setActiveTask("reindeer");
                }}
                onMouseEnter={() => playHover()}
              >
                <div className="task-icon">🦌</div>
                <div className="task-info">
                  <h3>Reindeer Control Panel</h3>
                </div>
              </button>
            </div>
          </section>
        )}

      <div className="active-task-container">
        {activeTask === "gift" && (
          <Task1
            sabotage={sabotage}
            onComplete={() => {
              handleTaskComplete();
              setActiveTask(null);
            }}
            playClick={playClick}
          />
        )}
        {activeTask === "memory" && (
          <Task2
            sabotage={sabotage}
            onComplete={() => {
              handleTaskComplete();
              setActiveTask(null);
            }}
          />
        )}
        {activeTask === "reindeer" && (
          <Task3
            sabotage={sabotage}
            onComplete={() => {
              handleTaskComplete();
              setActiveTask(null);
            }}
          />
        )}
      </div>

      {room.phase === "discussion-voting" && !isEliminated && (
        <section className="discussion-vote">
          <div className="chat-panel">
            <h3>💬 Discussion</h3>
            <div className="chat-box">
              {messages.map((m, i) => (
                <p key={i}>
                  <strong>{m.name}:</strong> {m.message}
                </p>
              ))}
            </div>
            <div className="chat-input">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Accuse… defend… lie…"
              />
              <button
                onClick={() => {
                  playClick();
                  sendMessage();
                }}
              >
                Send
              </button>
            </div>
          </div>
          <div className="vote-panel">
            <h3>🗳 Vote out the grinch</h3>
            {Object.values(room.players).map((p) => (
              <button
                key={p.id}
                className={`vote-target-btn ${
                  selectedVote === p.id ? "voted-active" : ""
                }`}
                onClick={() => {
                  setSelectedVote(p.id);
                  playClick?.();
                  socket.emit("cast-vote", {
                    roomCode,
                    targetId: p.id,
                  });
                }}
                onMouseEnter={() => playHover()}
              >
                <span className="player-name">Vote {p.name}</span>
                {selectedVote === p.id && (
                  <span className="voted-label">CONFIRMED</span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {!isEliminated && role && (
        <div className="role-identity-bar">
          <div className={`identity-tag ${role}`}>
            {role === "grinch" ? "😈 GRINCH" : "🎄 ELF"}
          </div>
        </div>
      )}

      {room.tasks && room.phase !== "lobby" && (
        <section className="player-strip">
          {Object.values(room.players).map((p) => (
            <div
              key={p.id}
              className={`player-pill ${p.id === room.hostId ? "host" : ""} ${
                p.id === socket.id ? "is-me" : ""
              }`}
            >
              {p.id === room.hostId ? "👑 " : "👤 "}
              {p.name}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
