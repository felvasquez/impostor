import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Create() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("8");
  const [impostors, setImpostors] = useState("1");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!hostName.trim()) {
      alert("Debes ingresar un nombre.");
      return;
    }

    try {
      setLoading(true);
      // 👇 Usa tu backend REST existente
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPlayers: Number(maxPlayers) || 8, impostors: Number(impostors) || 1 })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo crear la sala");
      }

      const { roomId, hostKey } = await res.json();

      // Guarda la hostKey para que Room.jsx te reconozca como host
      localStorage.setItem(`hostKey:${roomId}`, hostKey);

      // Navega a la sala pasando el nombre (Room.jsx hará join y usará hostKey del localStorage)
      navigate(`/room/${roomId}`, { state: { name: hostName.trim() } });
    } catch (err) {
      console.error(err);
      alert("Error creando la sala. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#6b7280",
  };

  return (
    <div className="container center-page" style={{ alignItems: "center", textAlign: "center" }}>
      <div style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)", marginBottom: "0.5rem" }}>✨</div>

      <h2 style={{
        fontSize: "clamp(1.4rem, 5vw, 2rem)",
        fontWeight: 900,
        margin: "0 0 0.3rem",
        color: "#e5e7eb",
        letterSpacing: "-0.5px",
      }}>
        Crear sala
      </h2>

      <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 1.75rem" }}>
        Configura la partida y comparte el código con tus amigos
      </p>

      <div className="card" style={{ width: "100%", maxWidth: "400px", textAlign: "left", padding: "1.5rem" }}>
        <label style={labelStyle}>Tu nombre</label>
        <input
          className="input mt2"
          placeholder="Ej: Felipe"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          autoFocus
          maxLength={20}
        />

        <div className="mt3">
          <label style={labelStyle}>Jugadores máximos</label>
          <input
            type="number"
            className="input mt2"
            min={3}
            max={12}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
          />
        </div>

        <div className="mt3">
          <label style={labelStyle}>Cantidad de impostores</label>
          <input
            type="number"
            className="input mt2"
            min={1}
            max={3}
            value={impostors}
            onChange={(e) => setImpostors(e.target.value)}
          />
        </div>

        <div className="actions mt4">
          <button
            className="btn"
            style={{ flex: 1, padding: "0.8rem 1rem" }}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creando…" : "Crear sala"}
          </button>
          <button
            className="btn secondary"
            style={{ padding: "0.8rem 1rem" }}
            onClick={() => navigate("/")}
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
