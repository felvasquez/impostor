import { useState } from "react";

export default function ClueScreen({ clues, currentTurnId, mySocketId, onSubmitClue, players }) {
  const [clueText, setClueText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clueText.trim()) return;
    onSubmitClue(clueText.trim());
    setClueText("");
  };

  const currentTurnPlayer = players.find(p => p.id === currentTurnId);
  const isMyTurn = currentTurnId === mySocketId;

  return (
    <div className="container center-page" style={{ alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Encabezado */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 900, color: "#e5e7eb" }}>
            Ronda de Pistas
          </h2>
          <p style={{ color: "#9ca3af", marginTop: "0.5rem" }}>
            Presta atención a las pistas de los demás jugadores.
          </p>
        </div>

        {/* Lista de Pistas */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {clues.length === 0 ? (
            <div style={{ textAlign: "center", color: "#6b7280", fontStyle: "italic", padding: "1rem" }}>
              Nadie ha dado una pista aún.
            </div>
          ) : (
            clues.map((clue, idx) => (
              <div key={idx} style={{ 
                background: "rgba(255,255,255,0.05)", 
                padding: "1rem", 
                borderRadius: "12px",
                borderLeft: clue.playerId === mySocketId ? "4px solid #6366f1" : "4px solid #4b5563"
              }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#9ca3af", marginBottom: "0.3rem" }}>
                  {clue.playerName}
                </div>
                <div style={{ color: "#e5e7eb", fontSize: "1.05rem" }}>
                  "{clue.text}"
                </div>
              </div>
            ))
          )}
        </div>

        {/* Turno Actual */}
        {currentTurnPlayer && (
          <div className="card" style={{ 
            borderColor: isMyTurn ? "#6366f1" : "rgba(255,255,255,0.1)",
            background: isMyTurn ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.02)"
          }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", color: "#e5e7eb" }}>
              Turno de: <span style={{ color: isMyTurn ? "#818cf8" : "#e5e7eb" }}>{isMyTurn ? "¡Ti!" : currentTurnPlayer.name}</span>
            </h3>
            
            {isMyTurn ? (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <input
                  className="input"
                  placeholder="Escribe tu pista aquí..."
                  value={clueText}
                  onChange={(e) => setClueText(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
                <button type="submit" className="btn" disabled={!clueText.trim()}>
                  Enviar Pista
                </button>
              </form>
            ) : (
              <div style={{ color: "#9ca3af", fontStyle: "italic", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                Esperando a que {currentTurnPlayer.name} escriba...
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
