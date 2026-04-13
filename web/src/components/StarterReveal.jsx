import { useEffect, useState } from "react";

const DURATION = 5;

export default function StarterReveal({ starterName, isMe, onDone }) {
  const [seconds, setSeconds] = useState(DURATION);

  useEffect(() => {
    if (seconds <= 0) { onDone(); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onDone]);

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
    background: "radial-gradient(ellipse at center, #1a1200 0%, #0d0900 60%, #000 100%)",
    cursor: "pointer",
    userSelect: "none",
  };

  const progressBar = {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "4px",
    background: "#f59e0b",
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
          50%       { transform: scale(1.1); }
        }
      `}</style>
      <div style={overlay} onClick={onDone}>
        <div style={{ fontSize: "clamp(3rem, 12vw, 5rem)", marginBottom: "1rem", animation: "pulse 1.5s ease infinite" }}>
          🎲
        </div>
        <p style={{
          color: "#9ca3af",
          fontSize: "clamp(1rem, 3.5vw, 1.3rem)",
          margin: "0 0 0.75rem",
          animation: "fadeUp 0.5s ease both",
        }}>
          ¡La ronda la empieza…
        </p>
        <h1 style={{
          fontSize: "clamp(2rem, 9vw, 4rem)",
          fontWeight: 900,
          color: "#f59e0b",
          margin: "0 0 0.75rem",
          textShadow: "0 0 40px rgba(245,158,11,0.6)",
          animation: "fadeUp 0.5s ease 0.15s both",
        }}>
          {starterName}
        </h1>
        {isMe && (
          <p style={{
            fontSize: "clamp(1rem, 4vw, 1.4rem)",
            color: "#fcd34d",
            fontWeight: 700,
            margin: "0 0 1rem",
            animation: "fadeUp 0.5s ease 0.3s both",
          }}>
            ¡Eso sos vos!
          </p>
        )}
        <p style={{ color: "#4b5563", fontSize: "0.85rem", marginTop: "1.5rem", animation: "fadeUp 0.5s ease 0.45s both" }}>
          Toca para continuar · cierra en {seconds}s
        </p>
        <div style={progressBar} />
      </div>
    </>
  );
}
