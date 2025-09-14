import React from "react";
import "../styles/linear.css";

type Tab = "lineal" | "multiplicativo";

export default function Navbar({
  current, onChange
}: { current: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="navbar">
      <div className="nav-brand">Generador de números aleatorios</div>
      <div className="nav-links">
        <button
          className={`nav-tab ${current === "lineal" ? "active" : ""}`}
          onClick={() => onChange("lineal")}
        >
          Lineal
        </button>
        <button
          className={`nav-tab ${current === "multiplicativo" ? "active" : ""}`}
          onClick={() => onChange("multiplicativo")}
        >
          Multiplicativo
        </button>
      </div>
    </nav>
  );
}
