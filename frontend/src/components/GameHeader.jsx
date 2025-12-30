import { socket } from "../socket";

export default function GameHeader({
  room,
  roomCode,
  timer,
  isHost,
  playClick,
}) {
  return (
    <>
      <header className="game-header">
        <h1>
          <span className="emoji-2">🎅</span> Santa’s Gift Heist
        </h1>
        {room.phase === "lobby" && <div className="room-code">{roomCode}</div>}

        {room.phase !== "lobby" && (
          <div className="game-timer">⏳ {timer}s</div>
        )}
      </header>

      {room.phase === "lobby" && (
        <section className="lobby-panel">
          <h2>🎄 Waiting for players to join...</h2>

          <div className="gift-loader-container">
            <div className="gift-box">
              <div className="gift-lid"></div>
              <div className="gift-ribbon-vertical"></div>
              <div className="gift-ribbon-horizontal"></div>
              <div className="gift-bow"></div>
            </div>
            <p className="loading-text">Preparing the Workshop...</p>
          </div>

          {!isHost && (
            <button
              className="secondary-btn"
              onClick={() => {
                playClick();
                socket.emit("leave-room", { roomCode });
                localStorage.removeItem("name");
                localStorage.removeItem("roomCode");
                window.location.reload();
              }}
            >
              Exit Lobby
            </button>
          )}
          {isHost && (
            <div className="host-controls">
              <button
                className="primary-btn"
                onClick={() => {
                  playClick();
                  socket.emit("start-game", { roomCode });
                }}
              >
                ▶ Start the Heist
              </button>

              <button
                className="secondary-btn"
                onClick={() => {
                  playClick();
                  localStorage.removeItem("name");
                  localStorage.removeItem("roomCode");
                  window.location.reload();
                }}
              >
                Exit Lobby
              </button>
            </div>
          )}
          <section className="player-strip">
            {Object.values(room.players).map((p) => (
              <div
                key={p.id}
                className={`player-pill 
      ${p.id === room.hostId ? "host" : ""} 
      ${p.id === socket.id ? "is-me" : ""}`}
              >
                {p.id === room.hostId ? "👑 " : "👤 "}
                {p.name}
              </div>
            ))}
          </section>
        </section>
      )}
    </>
  );
}
