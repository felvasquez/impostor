// Pantalla de votación a pantalla completa con botones por jugador

export default function VoteScreen({ candidates, mySocketId, iAmAlive, voteLocked, onVote }) {
  const votable = candidates.filter(p => p.id !== mySocketId);

  const overlay = {
    position: "fixed",
    inset: 0,
    zIndex: 998,
    background: "radial-gradient(ellipse at center, #1a1a0a 0%, #0d0d00 60%, #000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 1.5rem",
    overflowY: "auto",
  };

  const title = {
    fontSize: "clamp(1.8rem, 7vw, 3rem)",
    fontWeight: 900,
    color: "#f59e0b",
    margin: "0 0 0.25rem",
    textShadow: "0 0 30px rgba(245,158,11,0.5)",
    animation: "fadeUp 0.4s ease both",
  };

  const subtitle = {
    color: "#9ca3af",
    fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
    margin: "0 0 2rem",
    animation: "fadeUp 0.4s ease 0.1s both",
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(160px, 40vw), 1fr))",
    gap: "0.75rem",
    width: "100%",
    maxWidth: "600px",
    animation: "fadeUp 0.4s ease 0.2s both",
  };

  const playerBtn = (p) => {
    const isMe = p.id === mySocketId;
    const disabled = voteLocked || !iAmAlive || isMe;
    return {
      padding: "1.25rem 0.75rem",
      borderRadius: "16px",
      border: `2px solid ${voteLocked ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.35)"}`,
      background: disabled
        ? "rgba(255,255,255,0.03)"
        : "linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)",
      color: disabled ? "#4b5563" : "#f9fafb",
      fontSize: "clamp(1rem, 3.5vw, 1.2rem)",
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "transform 0.1s ease, filter 0.2s ease",
      textAlign: "center",
      width: "100%",
    };
  };

  const confirmedBox = {
    marginTop: "2rem",
    padding: "1rem 2rem",
    borderRadius: "14px",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.3)",
    color: "#10b981",
    fontWeight: 700,
    fontSize: "1.1rem",
    animation: "fadeUp 0.3s ease both",
  };

  const spectatorBox = {
    marginTop: "2rem",
    padding: "1rem 2rem",
    borderRadius: "14px",
    background: "rgba(124,58,237,0.1)",
    border: "1px solid rgba(124,58,237,0.3)",
    color: "#a78bfa",
    fontSize: "1rem",
    textAlign: "center",
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vote-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          transform: translateY(-2px);
        }
        .vote-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
      `}</style>
      <div style={overlay}>
        <div style={{ fontSize: "clamp(2.5rem, 10vw, 4rem)", marginBottom: "0.5rem" }}>🗳️</div>
        <h1 style={title}>VOTACIÓN</h1>
        <p style={subtitle}>¿Quién es el impostor? Elige a quién eliminar.</p>

        {iAmAlive ? (
          <>
            <div style={grid}>
              {votable.map(p => (
                <button
                  key={p.id}
                  className="vote-btn"
                  style={playerBtn(p)}
                  disabled={voteLocked}
                  onClick={() => !voteLocked && onVote(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {voteLocked && (
              <div style={confirmedBox}>✓ Voto registrado. Esperando al resto…</div>
            )}
          </>
        ) : (
          <>
            <div style={grid}>
              {votable.map(p => (
                <div key={p.id} style={{ ...playerBtn(p), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.name}
                </div>
              ))}
            </div>
            <div style={spectatorBox}>
              Estás eliminado — solo puedes observar la votación.
            </div>
          </>
        )}
      </div>
    </>
  );
}
