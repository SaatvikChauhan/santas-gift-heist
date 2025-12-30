import { useRef, useEffect, useState } from "react";

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
  const [status, setStatus] = useState("STABILIZE SYSTEMS");
  const [completed, setCompleted] = useState(false);
  const [slidersFrozen, setSlidersFrozen] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [showSabotageAlert, setShowSabotageAlert] = useState(false);

  const timerRef = useRef(null);
  const driftRef = useRef(null);
  const lastSabotageId = useRef(null);

  function resetTask(message = "SYSTEMS CRITICAL - RESETTING") {
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
    setStatus(message);
    startTimer();
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          resetTask();
          return 15;
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
    const check = (val, target) => val >= target.min && val <= target.max;
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
      <div className="gauge-info">
        <span className="gauge-icon">{icon}</span>
        <label>{label}</label>
        <span className="gauge-value">{value}%</span>
      </div>
      <div className="slider-track-container">
        <div
          className="target-zone-highlight"
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
          className="custom-range-input"
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

      <div className="task-modal sleigh-dashboard terminal-entrance">
        <div className="dashboard-glass-glare"></div>

        <header className="dashboard-header">
          <div className="round-counter header-left">
            <div className="status-light-group">
              <div
                className={`status-dot ${completed ? "success" : "alert"}`}
              ></div>
              <div className="status-dot pulse"></div>
            </div>
            <h3>SLEIGH NAVIGATION TERMINAL</h3>
          </div>
          <div className="dashboard-timer">
            <span className="timer-label">STABILITY_WINDOW</span>
            <span className={`timer-digit ${timeLeft < 5 ? "critical" : ""}`}>
              {timeLeft}s
            </span>
          </div>
        </header>

        <div className="gauges-container">
          <Slider
            label="THRUST VELOCITY"
            icon="🦌"
            value={speed}
            setter={setSpeed}
            target={targets.speed}
          />
          <Slider
            label="AERO BALANCE"
            icon="🌬️"
            value={wind}
            setter={setWind}
            target={targets.wind}
          />
          <Slider
            label="VORTEX ALIGNMENT"
            icon="🎯"
            value={nav}
            setter={setNav}
            target={targets.nav}
          />
        </div>

        {slidersFrozen && (
          <div className="freeze-overlay">
            <div className="ice-fringe"></div>
            <span className="freeze-text">SYSTEMS FROZEN BY GRINCH</span>
          </div>
        )}

        <footer className="dashboard-footer">
          <div className="instruction-box">
            <p className="glitch-text">ALIGN ALL GAUGES WITHIN TARGET ZONES</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
