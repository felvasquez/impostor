// web/src/api.js
const API = import.meta.env.VITE_BACKEND_URL;

export async function createRoom({ maxPlayers = 8, impostors = 1 }) {
  const res = await fetch(`${API}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxPlayers, impostors })
  });
  if (!res.ok) throw new Error("Error creando sala");
  return res.json(); // { roomId, hostKey }
}
