import { useRef, useState, useEffect } from "react";
import "../tasks.css";

const INITIAL_GIFTS = [
  { id: 3, color: "GTA6", logo: "/logos/gta6.png" },
  { id: 2, color: "Terraria", logo: "/logos/terraria.png" },
  { id: 1, color: "Minecraft", logo: "/logos/minecraft.png" },
  { id: 4, color: "Terraria", logo: "/logos/terraria.png" },
  { id: 5, color: "Minecraft", logo: "/logos/minecraft.png" },
  { id: 6, color: "GTA6", logo: "/logos/gta6.png" },
];

const KIDS = [
  {
    id: "judge1",
    name: "Pimmy",
    wants: "Minecraft",
    logo: "/logos/minecraft.png",
  },
  { id: "judge2", name: "Som", wants: "Terraria", logo: "/logos/terraria.png" },
  { id: "judge3", name: "Bhavya", wants: "GTA6", logo: "/logos/gta6.png" },
];

export default function Task1({ sabotage, onComplete, playClick }) {
  const lastSabotageId = useRef(null);
  const [errorShake, setErrorShake] = useState(false);
  const [gifts, setGifts] = useState(INITIAL_GIFTS);
  const [selectedGift, setSelectedGift] = useState(null);
  const [matched, setMatched] = useState(0);
  const [showSabotageAlert, setShowSabotageAlert] = useState(false);

  useEffect(() => {
    if (sabotage?.task === "gift" && sabotage.id !== lastSabotageId.current) {
      lastSabotageId.current = sabotage.id;
      triggerSabotageVisual();
    }
  }, [sabotage?.id]);

  function triggerSabotageVisual() {
    setShowSabotageAlert(true);
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
    setTimeout(() => setShowSabotageAlert(false), 1800);
    shuffleGifts();
  }

  function resetTask() {
    setErrorShake(true);
    setTimeout(() => setErrorShake(false), 500);
    setGifts(INITIAL_GIFTS);
    setSelectedGift(null);
    setMatched(0);
  }

  function handleKidClick(kid) {
    if (!selectedGift) return;

    if (kid.wants === selectedGift.color) {
      setGifts((prev) => prev.filter((g) => g.id !== selectedGift.id));
      const nextMatch = matched + 1;
      setMatched(nextMatch);
      setSelectedGift(null);

      if (nextMatch >= 3) {
        onComplete();
        resetTask();
      }
    } else {
      resetTask();
    }
  }

  function shuffleGifts() {
    setGifts((prev) => [...prev].sort(() => Math.random() - 0.5));
  }

  return (
    <div
      className={`task-overlay-container ${errorShake ? "screen-shake" : ""}`}
    >
      {showSabotageAlert && (
        <div className="sabotage-alert-overlay">
          <div className="sabotage-alert-panel">
            <div className="alert-icon">⚠️</div>
            <h2>SABOTAGE DETECTED</h2>
            <p>Inventory data corrupted. Reinitializing modules...</p>
          </div>
        </div>
      )}

      <div className="task-modal gift-sorting-ui">
        <header className="task-header">
          <div className="terminal-id">
            <span className="blink-dot" />
            <h3>DISPATCH_UNIT_01</h3>
          </div>
          <div className="round-counter">{matched} / 3</div>
        </header>

        <section className="judges-dispatch-row">
          {KIDS.map((kid) => (
            <div
              key={kid.id}
              className={`dispatch-card ${
                selectedGift ? "awaiting-input" : ""
              }`}
              onClick={() => handleKidClick(kid)}
            >
              <div className="card-header">{kid.name}</div>
              <img
                src={kid.logo}
                alt={kid.wants}
                className="wish-logo-hologram"
              />
              <div className="card-footer">STATUS: PENDING</div>
            </div>
          ))}
        </section>

        <div className="ui-divider">
          <span className="divider-label">INVENTORY REPOSITORY</span>
        </div>

        <section className="inventory-grid-3x2">
          {gifts.map((gift) => (
            <button
              key={gift.id}
              className={`inventory-node ${
                selectedGift?.id === gift.id ? "node-selected" : ""
              }`}
              onClick={() => {
                playClick();
                setSelectedGift(gift);
              }}
            >
              <div className="node-internal">
                <img src={gift.logo} alt={gift.color} className="node-logo" />
              </div>
              <div className="node-tag">{gift.color}</div>
            </button>
          ))}
        </section>

        <footer className="terminal-footer">
          <div className="warning-scroll">
            <span>
              CAUTION: INVALID DATA DISPATCH WILL RESULT IN SYSTEM REBOOT
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
