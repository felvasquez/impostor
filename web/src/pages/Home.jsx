// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container center-page" style={{ alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: "clamp(3rem, 12vw, 5rem)", marginBottom: "1rem", lineHeight: 1 }}>
        🎭
      </div>

      <h1 style={{
        fontSize: "clamp(2rem, 8vw, 3.5rem)",
        fontWeight: 900,
        margin: "0 0 0.5rem",
        letterSpacing: "-1px",
        background: "linear-gradient(135deg, #e5e7eb 30%, #6366f1 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        El Impostor
      </h1>

      <p style={{
        color: "#6b7280",
        fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)",
        margin: "0 0 2.5rem",
        letterSpacing: "0.01em",
      }}>
        Juego rápido de adivinanza y engaño
      </p>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        width: "100%",
        maxWidth: "300px",
      }}>
        <button
          className="btn"
          style={{ padding: "0.85rem 1rem", fontSize: "1rem", letterSpacing: "0.01em" }}
          onClick={() => navigate("/create")}
        >
          Crear sala
        </button>
        <button
          className="btn secondary"
          style={{ padding: "0.85rem 1rem", fontSize: "1rem" }}
          onClick={() => navigate("/join")}
        >
          Unirse a una sala
        </button>
      </div>
    </div>
  );
}
