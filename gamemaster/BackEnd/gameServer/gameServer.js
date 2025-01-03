require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const MAX_PLAYERS = 6;

// Create an HTTP server for the game server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Game server is running");
});

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-type"],
    credentials: true,
  },
});

const lobbies = {}; // Store lobbies in memory

// Middleware for token authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication failed. Token missing."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return next(new Error("Authentication failed. Invalid token."));
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("createLobby", ({ username }) => {
    const gameCode = generateGameCode();
    const lobby = {
      gameCode,
      players: [{ id: socket.id, name: username, isHost: true, selectedCharacter: null }],
    };
    lobbies[gameCode] = lobby;
    socket.join(gameCode);

    // Emit the game code back to the host
    socket.emit("lobbyCreated", { gameCode, host: username, players: lobby.players });

    // Emit `playerJoined` with the initial list
    io.to(gameCode).emit("playerJoined", lobby.players);
    console.log("Emitted playerJoined:", lobby.players);
  });

  socket.on("joinLobbyRoom", ({ gameCode, username }) => {
    const lobby = lobbies[gameCode];

    if (!lobby) {
      console.log("Lobby not found for gameCode:", gameCode);
      return socket.emit("lobbyError", "Lobby not found.");
    }

    if (lobby.players.length >= MAX_PLAYERS) {
      console.log("Lobby is full:", gameCode);
      return socket.emit("lobbyError", "Lobby is full.");
    }

    if (lobby.players.some((player) => player.id === socket.id)) {
      console.log(`${username} is already in the lobby.`);
      return;
    }

    lobby.players.push({ id: socket.id, name: username, isHost: false, selectedCharacter: null });
    socket.join(gameCode);

    console.log("Updated players in lobby:", lobby.players);

    // Emit the updated players list to everyone in the room
    io.to(gameCode).emit("playerJoined", lobby.players);
    io.to(gameCode).emit("playersUpdated", lobby.players);

    socket.emit("playerJoined", lobby.players);

  });

  socket.on("characterSelected", ({ gameCode, username, character }) => {
    const lobby = lobbies[gameCode];
    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }

    const player = lobby.players.find((p) => p.name === username);
    if (!player) {
      return socket.emit("lobbyError", "Player not found in the lobby.");
    }

    player.selectedCharacter = character;
    console.log(`${username} selected character:`, character);

    // Emit the updated character selections to everyone in the lobby
    const characterSelections = {};
lobby.players.forEach((p) => {
  characterSelections[p.name] = p.selectedCharacter;
});
io.to(gameCode).emit("characterSelected", characterSelections);

    
  });

  socket.on("getPlayersInGame", (gameCode) => {
    const lobby = lobbies[gameCode];
    if (lobby) {
      // Emit the current list of players to the requesting client
      socket.emit("playersUpdated", lobby.players);
      console.log(`Sent players list for gameCode ${gameCode}:`, lobby.players);
    } else {
      console.log(`Lobby not found for gameCode: ${gameCode}`);
      socket.emit("lobbyError", "Lobby not found.");
    }
  });
  

  socket.on("startGame", ({ gameCode }) => {
    const lobby = lobbies[gameCode];
    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }

    if (lobby.players.length < 2) {
      return socket.emit("lobbyError", "At least 2 players are required.");
    }

    if (lobby.players.some((player) => !player.selectedCharacter)) {
      return socket.emit("lobbyError", "All players must select a character.");
    }

    console.log(`Starting game for lobby: ${gameCode}`);
    io.to(gameCode).emit("gameStarted", { gameCode, players: lobby.players });
  });

  socket.on("disconnect", () => {
    for (const gameCode in lobbies) {
      const lobby = lobbies[gameCode];
      const playerIndex = lobby.players.findIndex(
        (player) => player.id === socket.id
      );

      if (playerIndex !== -1) {
        lobby.players.splice(playerIndex, 1);
        io.to(gameCode).emit("playerLeft", { players: lobby.players });

        if (lobby.players.length === 0) {
          delete lobbies[gameCode];
        }
        break;
      }
    }
  });
});

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});

function generateGameCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}
