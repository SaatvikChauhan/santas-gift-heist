import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const snowFlakes = Array.from({ length: 20 }).map((_, i) => {
  const style = {
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 10}s, ${Math.random() * 3}s`,
    opacity: Math.random(),
  };

  return (
    <div key={i} className="snowflake" style={style}>
      ❄
    </div>
  );
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <>
      {snowFlakes}
      <App />
    </>
  </StrictMode>
);
