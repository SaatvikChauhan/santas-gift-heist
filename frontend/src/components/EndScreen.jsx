export default function EndScreen({ winner, room }) {
  const isElves = winner === "elves";

  return (
    <div className={`end-screen ${isElves ? "elves" : "grinch"}`}>
      <div className="vignette" />

      <div className="end-panel">
        <h1 className="title">
          {isElves ? "🎄 ELVES VICTORY" : "😈 GRINCH TRIUMPHS"}
        </h1>

        <p className="subtitle">
          {isElves
            ? "All tasks completed. Christmas is saved!"
            : "Time expired. Chaos wins this round."}
        </p>

        <div className="stats">
          <div className="stat-card">
            <span className="label">TASKS</span>
            <span className="value">
              {room.tasks.completed} / {room.tasks.total}
            </span>
          </div>

          <div className="stat-card">
            <span className="label">ROUNDS</span>
            <span className="value">{room.round} / 3</span>
          </div>
        </div>

        <div className="footer-hint">
          Press <span>R</span> to Restart • Press <span>ESC</span> to Exit
        </div>
      </div>
    </div>
  );
}
