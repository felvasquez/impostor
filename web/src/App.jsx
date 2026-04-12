import { useEffect, useState } from "react";
import { socket } from "./socket";

// Ajusta si tu backend REST usa otro host/puerto
const API = import.meta.env.VITE_BACKEND_URL;

export default function App() {
  // ---- ESTADO ----
  const [connected, setConnected] = useState(false);
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);

  // ---- SUSCRIPCIONES SOCKET ----
  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("connect_error", (err) => {
      setLogs((prev) => [...prev, `connect_error: ${err.message}`]);
    });

    socket.on("roomUpdate", (playersFromServer) => {
      setPlayers(playersFromServer);
    });

    socket.on("errorMessage", (msg) => {
      setLogs((prev) => [...prev, `❌ ${msg}`]);
    });

    // Limpieza
    return () => socket.off();
  }, []);

  // ---- CREAR SALA (endpoint REST) ----
  async function handleCreateRoom() {
    try {
      const res = await fetch(`${API}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPlayers: 12, impostors: 1 }),
      });
      const data = await res.json(); // { roomId }
      if (data?.roomId) {
        setRoom(data.roomId);
        setLogs((p) => [...p, `✅ Sala creada: ${data.roomId}`]);
      } else {
        setLogs((p) => [...p, "⚠️ No se recibió roomId del servidor"]);
      }
    } catch (e) {
      setLogs((p) => [...p, `❌ Error creando sala: ${e.message}`]);
    }
  }

  // ---- UNIRSE A SALA (socket) ----
  function handleJoin() {
    if (!name.trim()) {
      setLogs((p) => [...p, "⚠️ Escribe tu nombre antes de unirte"]);
      return;
    }
    if (!room.trim()) {
      setLogs((p) => [...p, "⚠️ Crea o escribe el código de sala"]);
      return;
    }

    if (!socket.connected) socket.connect();
    socket.emit("joinRoom", { roomId: room, playerName: name });
    setJoined(true);
  }

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#eee",
        background: "#222",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ marginBottom: 8 }}>🎮 El Impostor - Prueba</h2>
      <p>Estado: {connected ? "🟢 Conectado" : "🔴 Desconectado"}</p>

      {/* Controles principales */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={handleCreateRoom}>Crear sala</button>

        <input
          placeholder="Código de sala (p.ej. ABC123)"
          value={room}
          onChange={(e) => setRoom(e.target.value.toUpperCase())}
          style={{ padding: 8, width: 220 }}
        />

        <input
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, width: 220 }}
        />

        <button onClick={handleJoin}>Unirme</button>
      </div>

      {/* Info unión */}
      {joined ? (
        <p>
          ✅ Te uniste a la sala <b>{room}</b> como <b>{name}</b>.
        </p>
      ) : (
        <p>☝️ Crea una sala o escribe un código y únete.</p>
      )}

      {/* Lista de jugadores */}
      <div style={{ marginTop: 16 }}>
        <h4>Jugadores en la sala:</h4>
        {players.length === 0 ? (
          <p>(vacío por ahora)</p>
        ) : (
          <ul>
            {players.map((p) => (
              <li key={p.id}>
                {p.name} {p.alive ? "" : "❌"}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Logs de debug */}
      <div style={{ marginTop: 16 }}>
        <h4>Mensajes:</h4>
        {logs.length === 0 ? (
          <p>(sin mensajes)</p>
        ) : (
          <ul>
            {logs.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
