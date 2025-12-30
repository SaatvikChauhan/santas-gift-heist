import { useRef, useEffect, useState } from "react";
import "../tasks.css";

const ICONS = ["🎄", "🔔", "🎁", "❄️"];

function generateSequence() {
  const sequence = [];
  let prev = null;

  for (let i = 0; i < 4; i++) {
    let next;
    do {
      next = ICONS[Math.floor(Math.random() * ICONS.length)];
    } while (next === prev);

    sequence.push(next);
    prev = next;
  }

  return sequence;
}

export default function Task2({ sabotage, onComplete }) {
  const lastSabotageId = useRef(null);

  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState([]);
  const [activeIcon, setActiveIcon] = useState(null);
  const [showing, setShowing] = useState(true);
  const [message, setMessage] = useState("WATCH THE CAROL...");
  const [shuffledIcons, setShuffledIcons] = useState(ICONS);
  const [errorShake, setErrorShake] = useState(false);
  const [showSabotageAlert, setShowSabotageAlert] = useState(false);

  useEffect(() => {
    if (sabotage?.task !== "memory") return;
    if (sabotage.id === lastSabotageId.current) return;

    lastSabotageId.current = sabotage.id;

    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);

    setShowSabotageAlert(true);
    setTimeout(() => setShowSabotageAlert(false), 1800);

    setShuffledIcons((prev) => [...prev].sort(() => Math.random() - 0.5));
    setTimeout(() => setShuffledIcons(ICONS), 5000);
  }, [sabotage?.id]);

  function startNewRound() {
    const seq = generateSequence();
    setSequence(seq);
    setPlayerInput([]);
    setShowing(true);
    setMessage("WATCH THE CAROL...");

    let i = 0;
    const interval = setInterval(() => {
      setActiveIcon(seq[i]);
      i++;

      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => {
          setActiveIcon(null);
          setShowing(false);
          setMessage("REPEAT THE CAROL!");
        }, 600);
      }
    }, 700);
  }

  useEffect(() => {
    startNewRound();
  }, []);

  function handleClick(icon) {
    if (showing) return;

    const nextInput = [...playerInput, icon];
    setPlayerInput(nextInput);

    if (sequence[nextInput.length - 1] !== icon) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      startNewRound();
      return;
    }

    if (nextInput.length === sequence.length) {
      onComplete();
    }
  }

  return (
    <div
      className={`task-overlay-container ${errorShake ? "screen-shake" : ""}`}
    >
      {showSabotageAlert && (
        <div className="sabotage-alert-overlay">
          <div className="sabotage-alert-panel">
            <div className="alert-icon">⚠️</div>
            <h2>SIGNAL JAMMED</h2>
            <p>Grinch interference detected. Audio matrix destabilized.</p>
          </div>
        </div>
      )}

      <div className="task-modal memory-terminal">
        <header className="task-header">
          <div className="terminal-id">
            <span className="blink-dot"></span>
            <h3>CAROL_SYNTH_v4</h3>
          </div>
          <div className="status-badge">{message}</div>
        </header>

        <div className={`playback-orb ${activeIcon ? "orb-active" : ""}`}>
          <div className="active-icon-display">
            {activeIcon ? activeIcon : "🎵"}
          </div>
        </div>

        <section className="memory-pad-grid">
          {shuffledIcons.map((icon) => (
            <button
              key={icon}
              className={`memory-pad ${showing ? "pad-locked" : ""} ${
                playerInput.includes(icon) && !showing ? "pad-pressed" : ""
              }`}
              onClick={() => handleClick(icon)}
            >
              <span className="pad-icon">{icon}</span>
            </button>
          ))}
        </section>

        <footer className="terminal-footer">
          <div className="input-progress">
            {sequence.map((_, i) => (
              <div
                key={i}
                className={`progress-dot ${
                  playerInput.length > i ? "filled" : ""
                }`}
              />
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
