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
import VoteScreen from "../components/VoteScreen";

export default function Room() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Clave de host guardada por sala (la setea el flujo de creación)
  const storedHostKey = localStorage.getItem(`hostKey:${roomId}`) || null;
  const [hostKey] = useState(storedHostKey);

  // Estado base
  const [connected, setConnected] = useState(false);
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

  const joinedRef = useRef(false);

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

    const onGameStarted = () => {
      setPhase("active");
      setLastResult(null);
      setVoteCandidates([]);
      setMyVoteLocked(false);
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

    const onRejoinSync = ({ phase, role, character }) => {
      setPhase(phase);
      if (role) {
        setMyRole(role);
        setMyCharacter(character || null);
      }
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

    // Si no hay nombre, pedirlo antes de conectar
    if (!joinedRef.current) {
      joinedRef.current = true;
      if (!name) {
        const n = prompt("Ingresa tu nombre");
        if (!n) { navigate("/join"); return; }
        setName(n);
      }
    }

    if (!socket.connected) socket.connect();

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

  const TallyTable = ({ tally }) => {
    if (!tally || !tally.length) return null;
    return (
      <table className="table">
        <thead>
          <tr>
            <th>Jugador</th>
            <th style={{ textAlign: "right" }}>Votos</th>
          </tr>
        </thead>
        <tbody>
          {tally.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td style={{ textAlign: "right" }}>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (showReveal && myRole) {
    return (
      <RoleReveal
        role={myRole}
        character={myCharacter}
        onDone={() => setShowReveal(false)}
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
          <p className="muted mt2">Comparte este enlace con tu grupo:</p>
          <div className="mt2" style={{ wordBreak: "break-all" }}>
            <span className="pill">{`${window.location.origin}/room/${roomId}`}</span>
          </div>
          <div className="actions mt3">
            <button className="btn" onClick={handleStartGame} disabled={phase !== "lobby"}>Iniciar partida</button>
            <button className="btn secondary" onClick={handleStartVote} disabled={phase !== "active"}>Iniciar votación</button>
            {phase === "result" && (
              <button className="btn ghost" onClick={handleResumeAfterVote}>Continuar ahora</button>
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

      {/* Resultado */}
      {phase === "result" && lastResult && (
        <div className="card mt4">
          <h4 className="m0">📜 Resultado</h4>
          <p className="mt2">
            Más votado: <b>{lastResult.eliminated || "(desconocido)"}</b> —{" "}
            {lastResult.wasImpostor
              ? <span className="ok">✅ Era impostor.</span>
              : <span className="danger">❌ NO era impostor.</span>}
          </p>
          <TallyTable tally={lastResult.tally} />
          {!isHost && <p className="muted mt2">Esperando a que el host continúe la ronda…</p>}
        </div>
      )}

      {/* Fin del juego */}
      {phase === "finished" && lastResult && (
        <div className="card mt4">
          <h3 className="m0">🏁 Fin del juego</h3>
          <p className="mt2">
            {lastResult.winner === "players"
              ? <>🎉 ¡Ganan los jugadores! {lastResult.impostor ? `(Impostor: ${lastResult.impostor})` : ""}</>
              : <>😈 ¡Ganan los impostores!</>
            }
          </p>
          <TallyTable tally={lastResult.tally} />
          <div className="actions mt3">
            <button className="btn ghost" onClick={() => navigate("/")}>Volver al inicio</button>
          </div>
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
