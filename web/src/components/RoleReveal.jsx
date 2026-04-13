import { useEffect, useState } from "react";

const DURATION = 5; // segundos antes de auto-cerrar

export default function RoleReveal({ role, character, onDone }) {
  const [seconds, setSeconds] = useState(DURATION);

  useEffect(() => {
    if (seconds <= 0) { onDone(); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onDone]);

  const isImpostor = role === "impostor";

  const overlay = {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "2rem",
    background: isImpostor
      ? "radial-gradient(ellipse at center, #3b0a0a 0%, #1a0505 60%, #0d0000 100%)"
      : "radial-gradient(ellipse at center, #0a1a3b 0%, #05101a 60%, #000d1a 100%)",
    cursor: "pointer",
    userSelect: "none",
  };

  const icon = { fontSize: "clamp(64px, 15vw, 96px)", marginBottom: "1rem" };

  const title = {
    fontSize: "clamp(2rem, 8vw, 4rem)",
    fontWeight: 900,
    letterSpacing: "0.05em",
    margin: "0 0 0.5rem",
    color: isImpostor ? "#ef4444" : "#6366f1",
    textShadow: isImpostor
      ? "0 0 40px rgba(239,68,68,0.6)"
      : "0 0 40px rgba(99,102,241,0.6)",
    animation: "fadeUp 0.6s ease both",
  };

  const subtitle = {
    fontSize: "clamp(1rem, 4vw, 1.5rem)",
    color: "#e5e7eb",
    margin: "0 0 2.5rem",
    animation: "fadeUp 0.6s ease 0.2s both",
  };

  const characterBadge = {
    display: "inline-block",
    padding: "0.5rem 1.5rem",
    borderRadius: "999px",
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.4)",
    fontSize: "clamp(1.1rem, 4vw, 1.6rem)",
    fontWeight: 700,
    color: "#a5b4fc",
    marginBottom: "2.5rem",
    animation: "fadeUp 0.6s ease 0.4s both",
  };

  const hint = {
    color: "#6b7280",
    fontSize: "0.85rem",
    animation: "fadeUp 0.6s ease 0.6s both",
  };

  const progressBar = {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "4px",
    background: isImpostor ? "#ef4444" : "#6366f1",
    width: `${(seconds / DURATION) * 100}%`,
    transition: "width 1s linear",
    opacity: 0.7,
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>
      <div style={overlay} onClick={onDone}>
        <div style={{ ...icon, animation: "pulse 2s ease infinite" }}>
          {isImpostor ? "😈" : "🕵️"}
        </div>
        <h1 style={title}>
          {isImpostor ? "ERES EL IMPOSTOR" : "ERES UN JUGADOR"}
        </h1>
        {isImpostor ? (
          <p style={subtitle}>
            Engaña a todos. No te descubran.
          </p>
        ) : (
          <>
            <p style={subtitle}>Tu personaje es:</p>
            <span style={characterBadge}>{character}</span>
          </>
        )}
        <p style={hint}>Toca para continuar · cierra en {seconds}s</p>
        <div style={progressBar} />
      </div>
    </>
  );
}
