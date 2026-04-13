// web/src/pages/Room.jsx
// -----------------------------------------------------------------------------
// Room con look & feel mejorado (clases de styles.css) y lógica actual:
// - Host robusto (hostKey + socket.id === hostPlayerId).
// - Votación con <select>, conteo y resultado.
// - "Continuar ahora" SOLO host (ACK + broadcast).
// - Secciones "En juego" y "Eliminados".
// - Si estás eliminado: banner y no puedes votar.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import RoleReveal from "../components/RoleReveal";
import StarterReveal from "../components/StarterReveal";
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
  const starterNameRef = useRef(null); // ref para leer starterName sin depender del closure


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

    const onGameStarted = ({ starterName: starter } = {}) => {
      setPhase("active");
      setLastResult(null);
      setVoteCandidates([]);
      setMyVoteLocked(false);
      if (starter) {
        starterNameRef.current = starter;
        setStarterName(starter);
        // showStarter lo activa onDone de RoleReveal, así siempre aparece después del reveal de rol
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

    const onRoundResumed = () => {
      setPhase("active");
      setMyVoteLocked(false);
      setLog(p => [...p, "▶️ Ronda reanudada por el host"]);
    };

    const onRejoinSync = ({ phase, role, character, starterName: starter }) => {
      setPhase(phase);
      if (role) {
        setMyRole(role);
        setMyCharacter(character || null);
      }
      if (starter) { starterNameRef.current = starter; setStarterName(starter); }
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
      if (ok) {
        setLog(p => [...p, "✔️ Continuación enviada"]);
        setPhase("active"); // El broadcast "roundResumed" igual llegará
      } else {
        setLog(p => [...p, "❌ No se pudo reanudar (verifica host/estado)"]);
      }
    });
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
        onDone={() => {
          setShowReveal(false);
          if (starterNameRef.current) setShowStarter(true);
        }}
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

  if (phase === "vote") {
    return (
      <VoteScreen
        candidates={voteCandidates}
        mySocketId={mySocketId}
        iAmAlive={iAmAlive}
        voteLocked={myVoteLocked}
        onVote={handleCastVote}
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
      />
    );
  }

  return (
    <div className={`container ${phase === "lobby" || phase === "finished" ? "center-page" : ""}`}>
      <h2 className="page-title">
        Sala {roomId}
        <span className="badge">{connected ? "🟢 Conectado" : "🔴 Desconectado"}</span>
      </h2>

      {/* Banner si estoy eliminado */}
      {me && !iAmAlive && (
        <div className="card" style={{ borderColor: "#7c3aed" }}>
          Has sido eliminado. Puedes seguir mirando, pero no participas en votaciones.
        </div>
      )}

      {/* Panel Host */}
      {isHost ? (
        <div className="card">
          <h3 className="m0">Eres creador de la sala</h3>

          {/* Link solo visible en lobby */}
          {phase === "lobby" && (
            <>
              <p className="muted mt2">Comparte este enlace con tu grupo:</p>
              <div className="mt2" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className="pill" style={{ wordBreak: "break-all", flex: 1 }}>
                  {`${window.location.origin}/room/${roomId}`}
                </span>
                <button
                  className="btn secondary"
                  style={{ whiteSpace: "nowrap", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
                  }}
                >
                  Copiar
                </button>
              </div>
            </>
          )}

          <div className="actions mt3">
            {phase === "lobby" && (
              <button className="btn" onClick={handleStartGame}>Iniciar partida</button>
            )}
            {phase === "active" && (
              <button className="btn secondary" onClick={handleStartVote}>Iniciar votación</button>
            )}
          </div>
        </div>
      ) : (
        <p className="muted">Jugador: <strong>{name}</strong></p>
      )}

      {/* Dos columnas (responsive) */}
      <div className="grid-2 mt4">
        {/* En juego */}
        <div className="card">
          <h4 className="m0 mb3">En juego</h4>
          {alivePlayers.length === 0 ? (
            <p className="muted">(vacío)</p>
          ) : (
            <ul className="list">
              {alivePlayers.map(p => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  {p.id === mySocketId && <span className="pill">Tú</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Eliminados */}
        <div className="card">
          <h4 className="m0 mb3">Eliminados</h4>
          {eliminatedPlayers.length === 0 ? (
            <p className="muted">(ninguno)</p>
          ) : (
            <ul className="list">
              {eliminatedPlayers.map(p => (
                <li key={p.id} data-dead="true">
                  <span>{p.name}</span>
                  <span className="pill">Fuera</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Rol privado */}
      {myRole && (
        <div className="card mt4">
          <h4 className="m0 mb3">Tu rol</h4>
          {myRole === "impostor" ? (
            <div>🤫 Eres el <b>IMPOSTOR</b></div>
          ) : (
            <div>🕵️ Eres <b>JUGADOR</b> — Personaje: <b>{myCharacter}</b></div>
          )}
        </div>
      )}

      {/* Logs (opcional para debug en dev) */}
      {log.length > 0 && (
        <div className="card mt4">
          <h4 className="m0">Mensajes</h4>
          <ul className="mt2">
            {log.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
