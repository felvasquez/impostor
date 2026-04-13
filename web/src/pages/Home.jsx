// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container center-page" style={{ alignItems: "center", textAlign: "center" }}>
      <h1 className="page-title">🎭 El Impostor</h1>
      <p className="muted">Juego rápido de adivinanza y engaño 😈</p>

      <div className="actions mt4" style={{ flexDirection: "column", width: "100%", maxWidth: "320px" }}>
        <button className="btn" onClick={() => navigate("/create")}>Crear sala</button>
        <button className="btn secondary" onClick={() => navigate("/join")}>Unirse a una sala</button>
      </div>
    </div>
  );
}
