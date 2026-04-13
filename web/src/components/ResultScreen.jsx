// Pantalla de resultado de votación (fase "result")

export default function ResultScreen({ result, isHost, onContinue }) {
  const { eliminated, wasImpostor, tally } = result;

  const overlay = {
    position: "fixed",
    inset: 0,
    zIndex: 998,
    background: wasImpostor
      ? "radial-gradient(ellipse at center, #052e16 0%, #020f07 60%, #000 100%)"
      : "radial-gradient(ellipse at center, #1c1001 0%, #0d0700 60%, #000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "2.5rem 1.5rem",
    overflowY: "auto",
  };

  const icon = {
    fontSize: "clamp(3rem, 12vw, 5rem)",
    marginBottom: "0.75rem",
    animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
  };

  const title = {
    fontSize: "clamp(1.6rem, 6vw, 2.8rem)",
    fontWeight: 900,
    margin: "0 0 0.4rem",
    color: wasImpostor ? "#10b981" : "#f59e0b",
    textShadow: wasImpostor
      ? "0 0 30px rgba(16,185,129,0.5)"
      : "0 0 30px rgba(245,158,11,0.5)",
    animation: "fadeUp 0.4s ease 0.1s both",
  };

  const nameTag = {
    display: "inline-block",
    fontSize: "clamp(1.2rem, 5vw, 2rem)",
    fontWeight: 800,
    padding: "0.4rem 1.2rem",
    borderRadius: "999px",
    background: wasImpostor
      ? "rgba(16,185,129,0.15)"
      : "rgba(245,158,11,0.12)",
    border: `1px solid ${wasImpostor ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.35)"}`,
    color: wasImpostor ? "#6ee7b7" : "#fcd34d",
    margin: "0 0 0.5rem",
    animation: "fadeUp 0.4s ease 0.2s both",
  };

  const verdict = {
    fontSize: "clamp(1rem, 3.5vw, 1.3rem)",
    color: "#9ca3af",
    margin: "0 0 2rem",
    animation: "fadeUp 0.4s ease 0.3s both",
  };

  const tallyBox = {
    width: "100%",
    maxWidth: "480px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.25rem",
    marginBottom: "1.5rem",
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

  const continueBtn = {
    marginTop: "0.5rem",
    padding: "0.9rem 2.5rem",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(180deg, #6366f1, #4f46e5)",
    color: "white",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
    animation: "fadeUp 0.4s ease 0.5s both",
  };

  const waitMsg = {
    color: "#6b7280",
    fontSize: "0.95rem",
    marginTop: "1rem",
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
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        .continue-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .continue-btn:active { transform: translateY(1px); }
      `}</style>
      <div style={overlay}>
        <div style={icon}>{wasImpostor ? "✅" : "❌"}</div>
        <h1 style={title}>
          {wasImpostor ? "¡Impostor encontrado!" : "No era el impostor"}
        </h1>
        <div style={nameTag}>{eliminated || "Desconocido"}</div>
        <p style={verdict}>
          {wasImpostor
            ? "fue eliminado correctamente. ¡Buen trabajo!"
            : "fue eliminado por error. El impostor sigue entre ustedes…"}
        </p>

        {tally && tally.length > 0 && (
          <div style={tallyBox}>
            <div style={tallyTitle}>Resultado de votos</div>
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

        {isHost ? (
          <button
            className="continue-btn"
            style={continueBtn}
            onClick={onContinue}
          >
            Continuar la ronda →
          </button>
        ) : (
          <p style={waitMsg}>⏳ Esperando que el host continúe la ronda…</p>
        )}
      </div>
    </>
  );
}
