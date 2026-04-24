// src/pages/Join.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const labelStyle = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#6b7280",
};

export default function Join() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return alert("Completa ambos campos.");
    navigate(`/room/${roomCode.trim().toUpperCase()}`, { state: { name: playerName.trim() } });
  };

  return (
    <div className="container center-page" style={{ alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)", marginBottom: "0.5rem" }}>🚪</div>

      <h2 style={{
        fontSize: "clamp(1.4rem, 5vw, 2rem)",
        fontWeight: 900,
        margin: "0 0 0.3rem",
        color: "#e5e7eb",
        letterSpacing: "-0.5px",
      }}>
        Unirse a sala
      </h2>

      <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 1.75rem" }}>
        Ingresa tu nombre y el código que te compartieron
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); handleJoin(); }}
        style={{ width: "100%", maxWidth: "400px", textAlign: "left" }}
      >
        <div className="card" style={{ padding: "1.5rem" }}>
          <label style={labelStyle}>Tu nombre</label>
          <input
            className="input mt2"
            placeholder="Ej: Elena"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            autoFocus
            maxLength={20}
          />

          <div className="mt3">
            <label style={labelStyle}>Código de sala</label>
            <input
              className="input mt2"
              placeholder="Ej: ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ letterSpacing: "0.15em", fontWeight: 700 }}
            />
          </div>

          <div className="actions mt4">
            <button
              type="submit"
              className="btn"
              disabled={!playerName.trim() || !roomCode.trim()}
              style={{ flex: 1, padding: "0.8rem 1rem" }}
            >
              Entrar
            </button>
            <button
              type="button"
              className="btn secondary"
              style={{ padding: "0.8rem 1rem" }}
              onClick={() => navigate("/")}
            >
              Volver
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
