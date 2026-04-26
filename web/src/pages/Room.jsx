// web/src/pages/Room.jsx
// -----------------------------------------------------------------------------
// Room con look & feel mejorado (clases de styles.css) y lógica actual:
// - Host robusto (hostKey + socket.id === hostPlayerId).
// - Votación con <select>, conteo y resultado.
// - "Continuar ahora" SOLO host (ACK + broadcast).
// - Secciones "En juego" y "Eliminados".
// - Si estás eliminado: banner y no puedes votar.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import RoleReveal from "../components/RoleReveal";
import StarterReveal from "../components/StarterReveal";
import ClueScreen from "../components/ClueScreen";
import RoomWelcome from "../components/RoomWelcome";
import VoteScreen from "../components/VoteScreen";
import ResultScreen from "../components/ResultScreen";
import GameOverScreen from "../components/GameOverScreen";

export default function Room() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Clave de host guardada por sala (la setea el flujo de creación)
  const storedHostKey = localStorage.getItem(`hostKey:${roomId}`) || null;
  const [hostKey] = useState(storedHostKey);

  // Estado base — inicializar desde el estado real del socket (puede ya estar conectado)
  const [connected, setConnected] = useState(socket.connected);
  const [players, setPlayers] = useState([]);
  const [hostPlayerId, setHostPlayerId] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [name, setName] = useState(state?.name || "");
  const [log, setLog] = useState([]);

  // Fases: lobby | active | vote | result | finished
  const [phase, setPhase] = useState("lobby");
  const [myRole, setMyRole] = useState(null);        // "player" | "impostor"
  const [myCharacter, setMyCharacter] = useState(null);

  // Votación
  const [voteCandidates, setVoteCandidates] = useState([]);
  const [myVoteLocked, setMyVoteLocked] = useState(false);
  const [lastResult, setLastResult] = useState(null); // voteResult o gameOver
  const [showReveal, setShowReveal] = useState(false);
  const [starterName, setStarterName] = useState(null);
  const [showStarter, setShowStarter] = useState(false);

  // Pistas (modo online)
  const [clues, setClues] = useState([]);
  const [currentTurnId, setCurrentTurnId] = useState(null);


  // Mostrar StarterReveal cuando phase pasa a "active" y hay un starter asignado
  // Este useEffect actúa como respaldo en caso de que el orden de eventos varíe
  useEffect(() => {
    if (phase === "active" && starterName && !showReveal) {
      console.log("[useEffect] activando StarterReveal para:", starterName);
      setShowStarter(true);
    }
  }, [phase, starterName, showReveal]);

  // Helpers
  const isHost = Boolean(hostKey) && mySocketId && hostPlayerId === mySocketId;
  const me = players.find(p => p.id === mySocketId);
  const iAmAlive = me ? me.alive : true;

  useEffect(() => {
    // --- Socket listeners ---
    const onConnect = () => {
      setConnected(true);
      setMySocketId(socket.id);
      // Re-emitir joinRoom en cada conexión/reconexión para recuperar el estado
      const currentName = name || state?.name;
      if (currentName) {
        socket.emit("joinRoom", {
          roomId,
          playerName: currentName,
          hostKey: hostKey || undefined,
        });
      }
    };
    const onDisconnect = () => setConnected(false);

    const onRoomUpdate = (payload) => {
      if (Array.isArray(payload)) {
        setPlayers(payload);
        return;
      }
      if (payload && typeof payload === "object") {
        setPlayers(payload.players || []);
        setHostPlayerId(payload.hostPlayerId || null);
      }
    };

    const onError = (msg) => setLog((p) => [...p, `❌ ${msg}`]);

    const onGameStarted = ({ starterName: starter, phase: newPhase, clueOrder } = {}) => {
      console.log("[gameStarted] starter recibido:", starter);
      setPhase(newPhase || "active");
      setLastResult(null);
      setVoteCandidates([]);
      setMyVoteLocked(false);
      setClues([]);
      if (clueOrder && clueOrder.length > 0) {
        setCurrentTurnId(clueOrder[0]);
      } else {
        setCurrentTurnId(null);
      }
      if (starter) {
        setStarterName(starter);
        setShowStarter(true);
      } else {
        console.warn("[gameStarted] starterName no vino del servidor");
      }
    };

    const onRoleAssigned = ({ role, character }) => {
      setMyRole(role);
      setMyCharacter(character || null);
      setShowReveal(true);
    };

    const onVoteStarted = ({ players }) => {
      setPhase("vote");
      setVoteCandidates(players);
      setMyVoteLocked(false);
      setShowStarter(false);
    };

    const onVoteResult = (payload) => {
      // payload: { eliminated, wasImpostor, alivePlayers, tally }
      setPhase("result");
      setLastResult(payload);
      setVoteCandidates([]);
      setMyVoteLocked(false);
    };

    const onGameOver = (payload) => {
      // payload: { winner, impostor?, tally }
      setPhase("finished");
      setLastResult(payload);
      setVoteCandidates([]);
      setMyVoteLocked(true);
    };

    const onRoundResumed = ({ starterName: starter } = {}) => {
      console.log("[roundResumed] starter recibido:", starter);
      setPhase("active");
      setMyVoteLocked(false);
      if (starter) {
        setStarterName(starter);
        setShowStarter(true);
      }
    };

    const onRejoinSync = ({ phase, role, character, starterName: starter, clues, currentTurnId }) => {
      setPhase(phase);
      if (role) {
        setMyRole(role);
        setMyCharacter(character || null);
      }
      if (starter) setStarterName(starter);
      if (clues) setClues(clues);
      if (currentTurnId) setCurrentTurnId(currentTurnId);
    };

    const onClueUpdated = ({ clues, currentTurnId }) => {
      setClues(clues || []);
      setCurrentTurnId(currentTurnId || null);
    };

    const onReturnedToLobby = () => {
      setPhase("lobby");
      setMyRole(null);
      setMyCharacter(null);
      setLastResult(null);
      setVoteCandidates([]);
      setMyVoteLocked(false);
      setStarterName(null);
      setShowStarter(false);
      setClues([]);
      setCurrentTurnId(null);
    };

    socket.off("connect", onConnect).on("connect", onConnect);
    socket.off("disconnect", onDisconnect).on("disconnect", onDisconnect);
    socket.off("roomUpdate", onRoomUpdate).on("roomUpdate", onRoomUpdate);
    socket.off("errorMessage", onError).on("errorMessage", onError);
    socket.off("gameStarted", onGameStarted).on("gameStarted", onGameStarted);
    socket.off("roleAssigned", onRoleAssigned).on("roleAssigned", onRoleAssigned);
    socket.off("voteStarted", onVoteStarted).on("voteStarted", onVoteStarted);
    socket.off("voteResult", onVoteResult).on("voteResult", onVoteResult);
    socket.off("gameOver", onGameOver).on("gameOver", onGameOver);
    socket.off("roundResumed", onRoundResumed).on("roundResumed", onRoundResumed);
    socket.off("rejoinSync", onRejoinSync).on("rejoinSync", onRejoinSync);
    socket.off("returnedToLobby", onReturnedToLobby).on("returnedToLobby", onReturnedToLobby);
    socket.off("clueUpdated", onClueUpdated).on("clueUpdated", onClueUpdated);

    // Sin nombre aún: esperar a que RoomWelcome lo provea
    if (!name) return;

    if (socket.connected) {
      // Ya conectado: sincronizar estado local y emitir joinRoom directamente
      setConnected(true);
      setMySocketId(socket.id);
      const currentName = name || state?.name;
      if (currentName) {
        socket.emit("joinRoom", {
          roomId,
          playerName: currentName,
          hostKey: hostKey || undefined,
        });
      }
    } else {
      socket.connect();
    }

  }, [roomId, name, navigate, hostKey]);

  // --- Acciones host ---
  const handleStartGame = () => {
    if (!isHost) return setLog(p=>[...p,"⚠️ No sos host"]);
    socket.emit("startGame", { roomId, hostKey });
  };

  const handleStartVote = () => {
    if (!isHost) return setLog(p=>[...p,"⚠️ No sos host"]);
    socket.emit("startVote", { roomId, hostKey });
  };

  const handleResumeAfterVote = () => {
    if (!isHost) return setLog(p=>[...p,"⚠️ No sos host"]);
    // ACK: el server confirma true/false para feedback inmediato
    socket.emit("resumeAfterVote", { roomId, hostKey }, (ok) => {
      if (!ok) setLog(p => [...p, "❌ No se pudo reanudar (verifica host/estado)"]);
    });
  };

  const handleBackToLobby = () => {
    if (!isHost) return setLog(p=>[...p,"⚠️ No sos host"]);
    socket.emit("backToLobby", { roomId, hostKey });
  };

  const handleSubmitClue = (text) => {
    socket.emit("submitClue", { roomId, clueText: text });
  };

  // --- Voto ---
  const handleCastVote = (targetId) => {
    if (!targetId || myVoteLocked) return;
    setMyVoteLocked(true);
    socket.emit("castVote", { roomId, targetId });
  };

  // --- UI helpers ---
  const alivePlayers = players.filter(p => p.alive);
  const eliminatedPlayers = players.filter(p => !p.alive);

  // Sin nombre: mostrar pantalla de bienvenida en lugar del prompt nativo
  if (!name) {
    return (
      <RoomWelcome
        roomId={roomId}
        onJoin={(playerName) => setName(playerName)}
      />
    );
  }

  if (showReveal && myRole) {
    return (
      <RoleReveal
        role={myRole}
        character={myCharacter}
        onDone={() => setShowReveal(false)}
      />
    );
  }

  if (showStarter && starterName) {
    return (
      <StarterReveal
        starterName={starterName}
        isMe={starterName === name}
        onDone={() => setShowStarter(false)}
      />
    );
  }

  if (phase === "clue_phase") {
    return (
      <ClueScreen
        clues={clues}
        currentTurnId={currentTurnId}
        mySocketId={mySocketId}
        onSubmitClue={handleSubmitClue}
        players={players}
      />
    );
  }

  if (phase === "vote") {
    return (
      <VoteScreen
        candidates={voteCandidates}
        mySocketId={mySocketId}
        iAmAlive={iAmAlive}
        voteLocked={myVoteLocked}
        onVote={handleCastVote}
        clues={clues}
      />
    );
  }

  if (phase === "result" && lastResult) {
    return (
      <ResultScreen
        result={lastResult}
        isHost={isHost}
        onContinue={handleResumeAfterVote}
      />
    );
  }

  if (phase === "finished" && lastResult) {
    return (
      <GameOverScreen
        result={lastResult}
        onRestart={() => navigate("/")}
        isHost={isHost}
        onBackToLobby={handleBackToLobby}
      />
    );
  }

  return (
    <div className={`container ${phase === "lobby" || phase === "finished" ? "center-page" : ""}`}
      style={phase === "lobby" ? { alignItems: "center" } : {}}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", width: "100%", maxWidth: phase === "lobby" ? "600px" : undefined }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4b5563" }}>
            Sala
          </p>
          <h2 style={{ margin: 0, fontSize: "clamp(1.3rem, 4vw, 1.8rem)", fontWeight: 900, letterSpacing: "-0.5px", color: "#e5e7eb" }}>
            {roomId}
          </h2>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          padding: "0.3rem 0.7rem", borderRadius: "999px",
          fontSize: "0.75rem", fontWeight: 600,
          background: connected ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          color: connected ? "#10b981" : "#ef4444",
          border: `1px solid ${connected ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
          {connected ? "Conectado" : "Desconectado"}
        </span>
      </div>

      {/* Banner si estoy eliminado */}
      {me && !iAmAlive && (
        <div className="card" style={{ borderColor: "#7c3aed", background: "rgba(124,58,237,0.08)", color: "#c4b5fd", width: "100%", maxWidth: phase === "lobby" ? "600px" : undefined }}>
          Has sido eliminado. Puedes seguir mirando, pero no participas en votaciones.
        </div>
      )}

      {/* Panel Host */}
      {isHost ? (
        <div className="card" style={{ width: "100%", maxWidth: phase === "lobby" ? "600px" : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.1rem" }}>👑</span>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#e5e7eb" }}>Eres el creador de la sala</h3>
          </div>

          {/* Link solo visible en lobby */}
          {phase === "lobby" && (
            <>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280" }}>
                Enlace para compartir
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{
                  flex: 1, padding: "0.45rem 0.75rem", borderRadius: 10,
                  border: "1px solid #1f2937", background: "#060b14",
                  fontSize: "0.8rem", color: "#9ca3af", wordBreak: "break-all",
                }}>
                  {`${window.location.origin}/room/${roomId}`}
                </span>
                <button
                  className="btn secondary"
                  style={{ whiteSpace: "nowrap", padding: "0.45rem 0.9rem", fontSize: "0.8rem" }}
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)}
                >
                  Copiar
                </button>
              </div>
            </>
          )}

          <div className="actions mt3">
            {phase === "lobby" && (
              <button className="btn" style={{ padding: "0.75rem 1.25rem" }} onClick={handleStartGame}>
                Iniciar partida
              </button>
            )}
            {phase === "active" && (
              <button className="btn secondary" style={{ padding: "0.75rem 1.25rem" }} onClick={handleStartVote}>
                Iniciar votación
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "0.5rem", width: "100%", maxWidth: phase === "lobby" ? "600px" : undefined }}>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Jugando como </span>
          <strong style={{ color: "#e5e7eb", fontSize: "0.95rem" }}>{name}</strong>
        </div>
      )}

      {/* Dos columnas (responsive) */}
      <div className="grid-2 mt4" style={{ width: "100%", maxWidth: phase === "lobby" ? "600px" : undefined }}>
        {/* En juego */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280" }}>En juego</h4>
            <span style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600 }}>{alivePlayers.length}</span>
          </div>
          {alivePlayers.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.85rem" }}>(vacío)</p>
          ) : (
            <ul className="list">
              {alivePlayers.map(p => (
                <li key={p.id} style={{ background: p.id === mySocketId ? "rgba(99,102,241,0.08)" : undefined, borderColor: p.id === mySocketId ? "rgba(99,102,241,0.2)" : "transparent" }}>
                  <span style={{ fontWeight: p.id === mySocketId ? 700 : 400 }}>{p.name}</span>
                  {p.id === mySocketId && (
                    <span style={{ padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 700, background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                      Tú
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Eliminados */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280" }}>Eliminados</h4>
            <span style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600 }}>{eliminatedPlayers.length}</span>
          </div>
          {eliminatedPlayers.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.85rem" }}>(ninguno)</p>
          ) : (
            <ul className="list">
              {eliminatedPlayers.map(p => (
                <li key={p.id} data-dead="true">
                  <span>{p.name}</span>
                  <span style={{ padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    Fuera
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Rol privado */}
      {myRole && (
        <div className="card mt4" style={{ width: "100%", maxWidth: phase === "lobby" ? "600px" : undefined }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280" }}>
            Tu rol
          </p>
          {myRole === "impostor" ? (
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#f87171" }}>🤫 Eres el IMPOSTOR</div>
          ) : (
            <div style={{ fontSize: "1rem", color: "#e5e7eb" }}>
              🕵️ Eres <strong>JUGADOR</strong> — Personaje: <strong style={{ color: "#818cf8" }}>{myCharacter}</strong>
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {log.length > 0 && (
        <div className="card mt4" style={{ width: "100%", maxWidth: phase === "lobby" ? "600px" : undefined }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280" }}>
            Mensajes
          </h4>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {log.map((m, i) => <li key={i} style={{ fontSize: "0.85rem", padding: "0.25rem 0", color: "#9ca3af" }}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
