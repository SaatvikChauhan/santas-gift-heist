export default function EndScreen({ winner, room }) {
  const isElves = winner === "elves";

  return (
    <div className="end-overlay">
      <div />

      <div className="end-panel">
        <h1 className={`end-title ${isElves ? "elves" : "grinch"}`}>
          {isElves ? "ELVES VICTORY" : "GRINCH TRIUMPHS"}
        </h1>

        <p className="end-description">
          {isElves
            ? "All tasks completed. Christmas is saved!"
            : "Time expired. Chaos wins this round."}
        </p>

        <div className="end-stats">
          <div className="end-stat-box">
            <span>TASKS</span>
            <span>
              {room.tasks.completed} / {room.tasks.total}
            </span>
          </div>

          <div className="end-stat-box">
            <span>ROUNDS</span>
            <span>{room.round} / 3</span>
          </div>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            window.location.reload();
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
