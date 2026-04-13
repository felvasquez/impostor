// Pantalla de fin de juego (fase "finished")

export default function GameOverScreen({ result, onRestart }) {
  const { winner, impostor, tally } = result;
  const playersWin = winner === "players";

  const overlay = {
    position: "fixed",
    inset: 0,
    zIndex: 998,
    background: playersWin
      ? "radial-gradient(ellipse at center, #0a1a3b 0%, #050d1a 60%, #000 100%)"
      : "radial-gradient(ellipse at center, #1a0505 0%, #0d0202 60%, #000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "2.5rem 1.5rem",
    overflowY: "auto",
    textAlign: "center",
  };

  const icon = {
    fontSize: "clamp(3.5rem, 14vw, 6rem)",
    marginBottom: "0.5rem",
    animation: "popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both",
  };

  const title = {
    fontSize: "clamp(2rem, 8vw, 3.5rem)",
    fontWeight: 900,
    margin: "0 0 0.3rem",
    color: playersWin ? "#6366f1" : "#ef4444",
    textShadow: playersWin
      ? "0 0 40px rgba(99,102,241,0.6)"
      : "0 0 40px rgba(239,68,68,0.6)",
    animation: "fadeUp 0.4s ease 0.1s both",
  };

  const subtitle = {
    fontSize: "clamp(1rem, 4vw, 1.4rem)",
    color: "#d1d5db",
    margin: "0 0 1.5rem",
    animation: "fadeUp 0.4s ease 0.2s both",
  };

  const revealBox = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.7rem 1.5rem",
    borderRadius: "999px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    fontSize: "clamp(1rem, 3.5vw, 1.2rem)",
    fontWeight: 700,
    marginBottom: "2rem",
    animation: "fadeUp 0.4s ease 0.3s both",
  };

  const tallyBox = {
    width: "100%",
    maxWidth: "480px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.25rem",
    marginBottom: "2rem",
    textAlign: "left",
    animation: "fadeUp 0.4s ease 0.4s both",
  };

  const tallyTitle = {
    color: "#6b7280",
    fontSize: "0.8rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "0.75rem",
  };

  const tallyRow = (i) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem 0",
    borderBottom: i < (tally?.length ?? 0) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
  });

  const restartBtn = {
    padding: "0.9rem 2.5rem",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s ease",
    animation: "fadeUp 0.4s ease 0.5s both",
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        .restart-btn:hover { background: rgba(255,255,255,0.1) !important; }
        .restart-btn:active { transform: scale(0.98); }
      `}</style>
      <div style={overlay}>
        <div style={{ ...icon, animation: "popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both, pulse 2.5s ease 0.8s infinite" }}>
          {playersWin ? "🏆" : "💀"}
        </div>

        <h1 style={title}>
          {playersWin ? "¡GANAN LOS JUGADORES!" : "¡GANAN LOS IMPOSTORES!"}
        </h1>

        <p style={subtitle}>
          {playersWin
            ? "El equipo descubrió al impostor. ¡Excelente trabajo!"
            : "Los impostores lograron engañar a todos."}
        </p>

        {impostor && (
          <div style={revealBox}>
            😈 El impostor era <strong>{impostor}</strong>
          </div>
        )}

        {!playersWin && !impostor && (
          <div style={{ ...revealBox, marginBottom: "2rem" }}>
            😈 Los impostores ganaron por mayoría
          </div>
        )}

        {tally && tally.length > 0 && (
          <div style={tallyBox}>
            <div style={tallyTitle}>Votos de la última ronda</div>
            {tally.map((row, i) => (
              <div key={row.id} style={tallyRow(i)}>
                <span style={{ color: "#e5e7eb", fontWeight: 600 }}>{row.name}</span>
                <span style={{
                  color: i === 0 ? "#f87171" : "#9ca3af",
                  fontWeight: i === 0 ? 700 : 400,
                  fontSize: i === 0 ? "1.1rem" : "1rem",
                }}>
                  {row.count} {row.count === 1 ? "voto" : "votos"}
                </span>
              </div>
            ))}
          </div>
        )}

        <button className="restart-btn" style={restartBtn} onClick={onRestart}>
          Volver al inicio
        </button>
      </div>
    </>
  );
}
