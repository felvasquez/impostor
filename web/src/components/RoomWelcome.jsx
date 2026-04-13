import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoomWelcome({ roomId, onJoin }) {
  const [inputName, setInputName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (!trimmed) return;
    onJoin(trimmed);
  };

  return (
    <div
      className="container center-page"
      style={{ alignItems: "center", textAlign: "center" }}
    >
      <div style={{ fontSize: "clamp(2.5rem, 10vw, 4rem)", marginBottom: "0.75rem" }}>🎭</div>

      <h1 style={{
        fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
        fontWeight: 900,
        margin: "0 0 0.3rem",
        color: "#e5e7eb",
      }}>
        El Impostor
      </h1>

      <p style={{ color: "#9ca3af", margin: "0 0 2rem", fontSize: "0.95rem" }}>
        Sala <span style={{ color: "#6366f1", fontWeight: 700 }}>{roomId}</span>
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ width: "100%", maxWidth: "360px" }}
      >
        <div className="card" style={{ textAlign: "left" }}>
          <label className="muted" style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tu nombre
          </label>
          <input
            className="input mt2"
            placeholder="Ej: Elena"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            autoFocus
            maxLength={20}
          />

          <div className="actions mt4">
            <button
              type="submit"
              className="btn"
              disabled={!inputName.trim()}
              style={{ flex: 1 }}
            >
              Unirme a la sala
            </button>
          </div>

          <button
            type="button"
            className="btn ghost"
            style={{ width: "100%", marginTop: "0.5rem" }}
            onClick={() => navigate("/")}
          >
            Volver al inicio
          </button>
        </div>
      </form>
    </div>
  );
}
