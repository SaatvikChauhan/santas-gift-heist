import { useRef, useEffect, useState } from "react";
import "../tasks.css";

function randomRange() {
  const min = Math.floor(Math.random() * 40) + 20;
  return { min, max: min + 15 };
}

function driftRange(range) {
  const drift = Math.floor(Math.random() * 11) - 5;
  let newMin = range.min + drift;
  newMin = Math.max(10, Math.min(newMin, 75));
  return { min: newMin, max: newMin + 15 };
}

export default function Task3({ sabotage, onComplete }) {
  const timerRef = useRef(null);
  const driftRef = useRef(null);
  const lastSabotageId = useRef(null);

  const [speed, setSpeed] = useState(10);
  const [wind, setWind] = useState(10);
  const [nav, setNav] = useState(10);
  const [targets, setTargets] = useState({
    speed: randomRange(),
    wind: randomRange(),
    nav: randomRange(),
  });
  const [timeLeft, setTimeLeft] = useState(15);
  const [activated, setActivated] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [slidersFrozen, setSlidersFrozen] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [showSabotageAlert, setShowSabotageAlert] = useState(false);
  const [showTimeoutPopup, setShowTimeoutPopup] = useState(false);

  function resetTask() {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
    setSpeed(10);
    setWind(10);
    setNav(10);
    setTargets({
      speed: randomRange(),
      wind: randomRange(),
      nav: randomRange(),
    });
    setTimeLeft(15);
    setActivated(false);
    setCompleted(false);
    startTimer();
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setShowTimeoutPopup(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function startDrift() {
    if (driftRef.current) clearInterval(driftRef.current);
    driftRef.current = setInterval(() => {
      setTargets((prev) => ({
        speed: driftRange(prev.speed),
        wind: driftRange(prev.wind),
        nav: driftRange(prev.nav),
      }));
    }, 5000);
  }

  useEffect(() => {
    startTimer();
    startDrift();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(driftRef.current);
    };
  }, []);

  useEffect(() => {
    if (!activated || completed) return;
    const check = (v, t) => v >= t.min && v <= t.max;
    if (
      check(speed, targets.speed) &&
      check(wind, targets.wind) &&
      check(nav, targets.nav)
    ) {
      clearInterval(timerRef.current);
      clearInterval(driftRef.current);
      setCompleted(true);
      onComplete();
    }
  }, [speed, wind, nav, targets, activated, completed]);

  useEffect(() => {
    if (
      sabotage?.task === "reindeer" &&
      sabotage.id !== lastSabotageId.current
    ) {
      lastSabotageId.current = sabotage.id;
      setSlidersFrozen(true);
      setTimeout(() => setSlidersFrozen(false), 5000);
      setShowSabotageAlert(true);
      setTimeout(() => setShowSabotageAlert(false), 1800);
    }
  }, [sabotage?.id]);

  const Slider = ({ label, icon, value, setter, target }) => (
    <div className={`dashboard-gauge ${slidersFrozen ? "frozen" : ""}`}>
      <div className="gauge-header">
        <span className="gauge-icon">{icon}</span>
        <span className="gauge-label">{label}</span>
        <span className="gauge-value">{value}%</span>
      </div>
      <div className="slider-track">
        <div
          className="target-zone"
          style={{
            left: `${target.min}%`,
            width: `${target.max - target.min}%`,
          }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={slidersFrozen}
          onChange={(e) => {
            setter(+e.target.value);
            setActivated(true);
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      className={`task-overlay-container ${errorShake ? "screen-shake" : ""}`}
    >
      {showSabotageAlert && (
        <div className="sabotage-alert-overlay">
          <div className="sabotage-alert-panel">
            <div className="alert-icon">⚠️</div>
            <h2>CONTROL SYSTEM LOCK</h2>
            <p>Reindeer sabotage detected. Manual input disabled.</p>
          </div>
        </div>
      )}
      {showTimeoutPopup && (
        <div className="sabotage-alert-overlay">
          <div className="sabotage-alert-panel">
            <div className="alert-icon">⏱️</div>
            <h2>STABILITY WINDOW EXPIRED</h2>
            <p>Sleigh alignment failed. Reinitializing systems...</p>
            <button
              className="terminal-action-button"
              onClick={() => {
                setShowTimeoutPopup(false);
                resetTask();
              }}
            >
              RESTART SYSTEM
            </button>
          </div>
        </div>
      )}

      <div className="task-modal sleigh-dashboard">
        <header className="task-header">
          <div className="terminal-id">
            <span className="blink-dot"></span>
            <h3>SLEIGH_NAV_SYS</h3>
          </div>
          <div className={`status-badge ${timeLeft < 5 ? "critical" : ""}`}>
            {timeLeft}s
          </div>
        </header>

        <section className="gauges-container">
          <Slider
            label="THRUST"
            icon="🦌"
            value={speed}
            setter={setSpeed}
            target={targets.speed}
          />
          <Slider
            label="STABILITY"
            icon="🌬️"
            value={wind}
            setter={setWind}
            target={targets.wind}
          />
          <Slider
            label="ALIGN"
            icon="🎯"
            value={nav}
            setter={setNav}
            target={targets.nav}
          />
        </section>

        <footer className="terminal-footer">
          <div className="instruction-text">
            ALIGN ALL GAUGES WITHIN TARGET ZONES
          </div>
        </footer>
      </div>
    </div>
  );
}
