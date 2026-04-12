import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Create() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [impostors, setImpostors] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!hostName.trim()) {
      alert("Debes ingresar un nombre.");
      return;
    }

    try {
      setLoading(true);
      // 👇 Usa tu backend REST existente
      const res = await fetch("http://localhost:3000/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPlayers, impostors })
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

  return (
    <div className="container center-page">
      <h2 className="page-title">Crear sala</h2>

      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <label className="muted">Tu nombre</label>
        <input
          className="input mt2"
          placeholder="Ej: Felipe"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
        />

        <div className="mt3">
          <label className="muted">Jugadores máximos</label>
          <input
            type="number"
            className="input mt2"
            min={3}
            max={12}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />
        </div>

        <div className="mt3">
          <label className="muted">Cantidad de impostores</label>
          <input
            type="number"
            className="input mt2"
            min={1}
            max={3}
            value={impostors}
            onChange={(e) => setImpostors(Number(e.target.value))}
          />
        </div>

        <div className="actions mt4" style={{ width: "100%" }}>
          <button className="btn" onClick={handleCreate} disabled={loading}>
            {loading ? "Creando…" : "Crear sala"}
          </button>
          <button className="btn secondary" onClick={() => navigate("/")}>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
