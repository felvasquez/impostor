// server/server.js
// -----------------------------------------------------------------------------
// Backend con Express + Socket.IO:
// - Acciones de host validadas por hostKey + socket.id === hostPlayerId.
// - Votación con conteo, elimina no-impostor y continúa misma ronda.
// - resumeAfterVote con ACK y broadcast.
// - FIXES:
//    * Emite roomUpdate después de eliminar para refrescar "Eliminados".
//    * Bloquea votos de jugadores eliminados (alive=false).
// -----------------------------------------------------------------------------

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingInterval: 10000,
  pingTimeout: 25000,
});

// rooms: Map<roomId, { id, hostKey, hostPlayerId, players[], impostors, maxPlayers, round, finished, votes, voters, lastPhase }>
const rooms = new Map();

function assertHost(room, payloadHostKey) {
  return room && room.hostKey === String(payloadHostKey || "");
}

app.post("/api/rooms", (req, res) => {
  const { maxPlayers = 8, impostors = 1 } = req.body || {};

  const hostKey = crypto.randomBytes(16).toString("hex").toUpperCase();
  const roomId = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 hex

  rooms.set(roomId, {
    id: roomId,
    hostKey,
    hostPlayerId: null,
    players: [],          // { id, name, alive }
    impostors,
    maxPlayers,
    round: null,          // { character, impostorIds[] }
    finished: false,
    votes: {},            // Record<targetId, count>
    voters: new Set(),    // Set<socket.id> ya votó esta ronda
    lastPhase: "lobby",   // "lobby" | "active" | "vote" | "result" | "finished"
  });

  console.log(`🆕 Sala creada: ${roomId}  (hostKey=${hostKey.slice(0, 6)}...)`);
  res.json({ roomId, hostKey });
});

io.on("connection", (socket) => {
  console.log("🔌 Nuevo socket:", socket.id);

  socket.on("joinRoom", ({ roomId, playerName, hostKey }) => {
    roomId = String(roomId || "").trim().toUpperCase();
    playerName = String(playerName || "").trim();
    if (!roomId || !playerName) {
      socket.emit("errorMessage", "Código o nombre inválido.");
      return;
    }

    let room = rooms.get(roomId);
    if (!room) {
      rooms.set(roomId, {
        id: roomId,
        hostKey: crypto.randomBytes(16).toString("hex").toUpperCase(),
        hostPlayerId: null,
        players: [],
        impostors: 1,
        maxPlayers: 12,
        round: null,
        finished: false,
        votes: {},
        voters: new Set(),
        lastPhase: "lobby",
      });
      room = rooms.get(roomId);
      console.log(`🆕 Sala creada automáticamente: ${roomId}`);
    }

    // Preservar estado alive si el jugador existía antes (reconexión)
    const previousPlayer = room.players.find(p => p.name === playerName);
    const wasAlive = previousPlayer ? previousPlayer.alive : true;

    // Anti-duplicados por socket y por nombre
    room.players = room.players.filter(p => p.id !== socket.id && p.name !== playerName);

    // Si trae hostKey válido, este socket será el host activo
    if (hostKey && assertHost(room, hostKey)) {
      room.hostPlayerId = socket.id;
      console.log(`👑 Host identificado en ${roomId} (${playerName})`);
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit("errorMessage", "La sala está llena.");
      return;
    }

    const player = { id: socket.id, name: playerName, alive: wasAlive };
    room.players.push(player);
    socket.join(roomId);

    io.to(roomId).emit("roomUpdate", {
      players: room.players,
      hostPlayerId: room.hostPlayerId
    });

    // Sincronizar estado de la partida si ya empezó
    if (room.round && room.lastPhase !== "lobby") {
      const isImpostor = room.round.impostorNames?.includes(playerName);

      // Actualizar impostorIds con el nuevo socket.id
      if (isImpostor && !room.round.impostorIds.includes(socket.id)) {
        room.round.impostorIds = room.round.impostorIds.filter(id =>
          room.players.some(p => p.id === id)
        );
        room.round.impostorIds.push(socket.id);
      }

      socket.emit("rejoinSync", {
        phase: room.lastPhase,
        role: isImpostor ? "impostor" : "player",
        character: isImpostor ? null : room.round.character,
        starterName: room.round.starterName || null,
      });

      // Si estaba en votación, reenviar candidatos
      if (room.lastPhase === "vote") {
        socket.emit("voteStarted", {
          players: room.players.filter(p => p.alive)
        });
      }

      console.log(`🔄 Rejoin sync (${roomId}): ${playerName} → fase "${room.lastPhase}"`);
    }
  });

  socket.on("startGame", ({ roomId, hostKey }) => {
    roomId = String(roomId || "").trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return;

    if (!assertHost(room, hostKey) || room.hostPlayerId !== socket.id) {
      socket.emit("errorMessage", "No autorizado para iniciar la partida.");
      return;
    }

    const characters = [
      "Spider-Man", "Mario Bros", "Elsa", "Shrek", "Batman",
      "Darth Vader", "Indiana Jones", "Gandalf", "Hércules",
      "Chuck Norris", "Marilyn Monroe", "Marilyn Manson",
      "Mario Kreutzberger", "Chuky", "Napoleón", "E.T",
      "Frodo", "Alexis Sánchez", "El grinch", "Maradona",
      "Pelé", "Xuxa", "Messi", "Shakira", "La Rosario",
      "Julio Iglesias", "Marcelo Ríos", "Gloria Estefan",
      "Iván Zamorano", "Peter la Anguila", "Condorito"
    ];

    const character = characters[Math.floor(Math.random() * characters.length)];
    const shuffled = [...room.players].sort(() => Math.random() - 0.5);
    const impostors = shuffled.slice(0, room.impostors);
    const impostorIds = impostors.map(p => p.id);
    const impostorNames = impostors.map(p => p.name);

    const starter = room.players[Math.floor(Math.random() * room.players.length)];

    room.round = { character, impostorIds, impostorNames, starterName: starter.name };
    room.finished = false;
    room.votes = {};
    room.voters = new Set();
    room.lastPhase = "active";

    room.players.forEach((p) => {
      const isImpostor = impostorIds.includes(p.id);
      io.to(p.id).emit("roleAssigned", {
        role: isImpostor ? "impostor" : "player",
        character: isImpostor ? null : character
      });
    });

    const starterName = starter.name;
    console.log(`🎭 Partida iniciada (${roomId}) con "${character}" — empieza: ${starterName}`);
    io.to(roomId).emit("gameStarted", { starterName });
  });

  socket.on("startVote", ({ roomId, hostKey }) => {
    roomId = String(roomId || "").trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return;

    if (!assertHost(room, hostKey) || room.hostPlayerId !== socket.id) {
      socket.emit("errorMessage", "No autorizado para iniciar votación.");
      return;
    }

    // Verificar condición de victoria antes de iniciar la votación
    const impostorsAlive = room.players.filter(p => p.alive && room.round?.impostorIds.includes(p.id)).length;
    const playersAlive   = room.players.filter(p => p.alive && !room.round?.impostorIds.includes(p.id)).length;
    if (room.round && impostorsAlive >= playersAlive) {
      room.finished = true;
      room.lastPhase = "finished";
      io.to(roomId).emit("gameOver", { winner: "impostors", tally: [] });
      return;
    }

    room.votes = {};
    room.voters = new Set();
    room.lastPhase = "vote";
    io.to(roomId).emit("voteStarted", {
      players: room.players.filter(p => p.alive)
    });
  });

  socket.on("castVote", ({ roomId, targetId }) => {
    roomId = String(roomId || "").trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room || !room.round) return;

    // 🛡️ NEW: el votante debe estar vivo
    const me = room.players.find(p => p.id === socket.id);
    if (!me || !me.alive) {
      socket.emit("errorMessage", "Estás eliminado y no puedes votar.");
      return;
    }

    // Ya votó este socket
    if (room.voters.has(socket.id)) {
      socket.emit("errorMessage", "Ya votaste en esta ronda.");
      return;
    }
    // No te puedes votar a ti mismo
    if (targetId === socket.id) {
      socket.emit("errorMessage", "No puedes votarte a ti mismo.");
      return;
    }
    // Objetivo válido y vivo
    const target = room.players.find(p => p.id === targetId && p.alive);
    if (!target) {
      socket.emit("errorMessage", "Objetivo inválido.");
      return;
    }

    // Registrar voto
    room.votes[targetId] = (room.votes[targetId] || 0) + 1;
    room.voters.add(socket.id);

    const alive = room.players.filter(p => p.alive);
    const totalVotes = room.voters.size;

    if (totalVotes >= alive.length) {
      // Conteo/tally sobre vivos antes de eliminar
      const aliveBefore = room.players.filter(p => p.alive);
      const counts = Object.assign(
        {},
        ...aliveBefore.map(p => ({ [p.id]: 0 }))
      );
      for (const [id, c] of Object.entries(room.votes)) {
        counts[id] = (counts[id] || 0) + c;
      }
      const tally = aliveBefore
        .map(p => ({ id: p.id, name: p.name, count: counts[p.id] || 0 }))
        .sort((a, b) => b.count - a.count);

      // Más votado
      const [mostVotedId] = Object.entries(room.votes).sort((a, b) => b[1] - a[1])[0];
      const eliminated = room.players.find(p => p.id === mostVotedId);
      const wasImpostor = room.round.impostorIds.includes(mostVotedId);

      // Eliminar del juego
      if (eliminated) eliminated.alive = false;

      // 🟢 NEW: Broadcast inmediato del estado actualizado (para listas En juego/Eliminados)
      io.to(roomId).emit("roomUpdate", {
        players: room.players,
        hostPlayerId: room.hostPlayerId
      });

      // Reset de estructuras de votación
      room.votes = {};
      room.voters = new Set();

      if (wasImpostor) {
        room.finished = true;
        room.lastPhase = "finished";
        io.to(roomId).emit("gameOver", {
          winner: "players",
          impostor: eliminated?.name,
          tally
        });
        console.log(`✅ Impostor eliminado (${eliminated?.name}) en ${roomId}`);
      } else {
        const impostorsAlive = room.players.filter(p => p.alive && room.round.impostorIds.includes(p.id)).length;
        const playersAlive  = room.players.filter(p => p.alive && !room.round.impostorIds.includes(p.id)).length;

        if (impostorsAlive >= playersAlive) {
          room.finished = true;
          room.lastPhase = "finished";
          io.to(roomId).emit("gameOver", {
            winner: "impostors",
            tally
          });
          console.log(`😈 Impostores ganan (mayoría) en ${roomId}`);
        } else {
          // Esperar al host para continuar
          room.lastPhase = "result";
          io.to(roomId).emit("voteResult", {
            eliminated: eliminated?.name,
            wasImpostor,
            alivePlayers: room.players.filter(p => p.alive),
            tally
          });
          console.log(`❌ ${eliminated?.name} no era impostor (${roomId}). A la espera del host para continuar.`);
        }
      }
    }
  });

  // Reanudar la ronda tras un resultado de votación (solo host) con ACK
  socket.on("resumeAfterVote", ({ roomId, hostKey }, cb) => {
    try {
      roomId = String(roomId || "").trim().toUpperCase();
      const room = rooms.get(roomId);
      if (!room) return cb && cb(false);

      if (!assertHost(room, hostKey) || room.hostPlayerId !== socket.id) {
        socket.emit("errorMessage", "No autorizado para continuar la ronda.");
        return cb && cb(false);
      }

      if (room.lastPhase !== "result" || room.finished) {
        socket.emit("errorMessage", "La ronda no está en estado reanudable.");
        return cb && cb(false);
      }

      const alivePlayers = room.players.filter(p => p.alive);
      const starter = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      if (room.round) room.round.starterName = starter?.name || null;

      room.lastPhase = "active";
      io.to(roomId).emit("roundResumed", { starterName: starter?.name || null });
      console.log(`▶️ Ronda reanudada por el host en ${roomId} — empieza: ${starter?.name}`);
      return cb && cb(true);
    } catch {
      return cb && cb(false);
    }
  });

  socket.on("backToLobby", ({ roomId, hostKey }) => {
    roomId = String(roomId || "").trim().toUpperCase();
    const room = rooms.get(roomId);
    if (!room) return;

    if (!assertHost(room, hostKey) || room.hostPlayerId !== socket.id) {
      socket.emit("errorMessage", "No autorizado para volver a la sala.");
      return;
    }

    // Reiniciar estado de juego
    room.round = null;
    room.finished = false;
    room.votes = {};
    room.voters = new Set();
    room.lastPhase = "lobby";

    // Revivir a todos
    room.players.forEach(p => {
      p.alive = true;
    });

    // Actualizar listas en UI
    io.to(roomId).emit("roomUpdate", {
      players: room.players,
      hostPlayerId: room.hostPlayerId
    });

    // Avisar que volvemos al lobby
    io.to(roomId).emit("returnedToLobby");
    console.log(`🏠 Sala ${roomId} reiniciada a lobby por el host.`);
  });

  socket.on("disconnect", () => {
    rooms.forEach((room, id) => {
      const before = room.players.length;
      room.players = room.players.filter(p => p.id !== socket.id);

      if (room.hostPlayerId === socket.id) {
        room.hostPlayerId = null; // host activo se fue
      }

      if (room.players.length !== before) {
        io.to(id).emit("roomUpdate", {
          players: room.players,
          hostPlayerId: room.hostPlayerId
        });
      }
    });
    console.log("❌ Desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend corriendo en el puerto ${PORT}`);
});
