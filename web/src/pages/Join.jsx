// src/pages/Join.jsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
      <h2 className="page-title">Unirse a sala</h2>

      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <label className="muted">Tu nombre</label>
        <input
          className="input mt2"
          placeholder="Ej: Elena"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <div className="mt3">
          <label className="muted">Código de sala</label>
          <input
            className="input mt2"
            placeholder="Ej: ABC123"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
        </div>

        <div className="actions mt4">
          <button className="btn" onClick={handleJoin}>Entrar</button>
          <button className="btn secondary" onClick={() => navigate("/")}>Volver</button>
        </div>
      </div>
    </div>
  );
}
