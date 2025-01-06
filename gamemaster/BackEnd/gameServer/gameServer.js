require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const MAX_PLAYERS = 6;

const lobbies = {}; // Store lobbies in memory

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

    socket.emit("lobbyCreated", { gameCode, host: username, players: lobby.players });
    io.to(gameCode).emit("playerJoined", lobby.players);
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

    io.to(gameCode).emit("playerJoined", lobby.players);
    io.to(gameCode).emit("playersUpdated", lobby.players);

    socket.emit("playerJoined", lobby.players);
  });

  socket.on("characterSelected", ({ gameCode, username, character }) => {
    const lobby = lobbies[gameCode];
    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }

    if (!Array.isArray(lobby.players)) {
      lobby.players = [];
    }

    const player = lobby.players.find((p) => p.name === username);
    if (!player) {
      return socket.emit("lobbyError", "Player not found in the lobby.");
    }

    player.selectedCharacter = character;
    io.to(gameCode).emit(
      "characterSelected",
      lobby.players.reduce((acc, p) => ({ ...acc, [p.name]: p.selectedCharacter }), {})
    );
  });

  socket.on("getPlayersInGame", (gameCode) => {
    const lobby = lobbies[gameCode];
    if (lobby) {
      if (!Array.isArray(lobby.players)) {
        lobby.players = [];
      }
      socket.emit("playersUpdated", lobby.players);
    } else {
      socket.emit("lobbyError", "Lobby not found.");
    }
  });

  socket.on("startGame", async ({ gameCode }) => {
    const lobby = lobbies[gameCode];
    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }

    if (!Array.isArray(lobby.players)) {
      lobby.players = [];
    }

    if (lobby.players.length < 2) {
      return socket.emit("lobbyError", "At least 2 players are required.");
    }

    if (lobby.players.some((player) => !player.selectedCharacter)) {
      return socket.emit("lobbyError", "All players must select a character.");
    }

    lobby.currentTurnIndex = 0;

    try {
      const response = await axios.post("http://host.docker.internal:6000/startGame", {
        gameCode,
        players: lobby.players,
      });

      lobby.introduction = response.data.introduction;

      io.to(gameCode).emit("gameStarted", {
        introduction: response.data.introduction,
        gameState: {
          players: lobby.players,
        },
        currentTurnPlayer: lobby.players[lobby.currentTurnIndex]?.name || null,
      });
      console.log("Emitting gameStarted:", {
        introduction: response.data.introduction,
        gameState: { players: lobby.players },
        currentTurnPlayer: lobby.players[lobby.currentTurnIndex]?.name || null,
      });
      
    } catch (error) {
      console.error("Error communicating with GameMaster AI:", error.message);
      socket.emit("lobbyError", "Failed to start the game.");
    }
  });

  socket.on("playerAction", async (actionData, callback) => {
    const { action } = actionData;
    const gameCode = Object.keys(lobbies).find((code) =>
      lobbies[code].players.some((p) => p.id === socket.id)
    );

    if (!gameCode) {
      return callback({ success: false, response: "Game not found." });
    }

    const lobby = lobbies[gameCode];
    if (!lobby) {
      return callback({ success: false, response: "Lobby not found." });
    }

    const currentTurnPlayer = lobby.players[lobby.currentTurnIndex];
    if (!currentTurnPlayer || currentTurnPlayer.id !== socket.id) {
      return callback({ success: false, response: "It's not your turn." });
    }

    if (!Array.isArray(lobby.players)) {
      lobby.players = [];
    }

    try {
      const response = await axios.post("http://host.docker.internal:6000/processAction", {
        action,
        player: currentTurnPlayer.name,
        gameState: lobby,
      });

      io.to(gameCode).emit("aiResponse", {
        player: currentTurnPlayer.name,
        action,
        response: response.data.response,
      });

      callback({ success: true, response: response.data.response });

      const nextPlayer = advanceTurn(lobby);
      io.to(gameCode).emit("turnUpdate", { player: nextPlayer.name });

      io.to(gameCode).emit("gameStateUpdated", {
        players: lobby.players,
        introduction: lobby.introduction,
      });
    } catch (error) {
      callback({ success: false, response: "Failed to process the action." });
    }
  });

  socket.on("disconnect", () => {
    for (const gameCode in lobbies) {
      const lobby = lobbies[gameCode];
      const playerIndex = lobby.players.findIndex((player) => player.id === socket.id);

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

function advanceTurn(lobby) {
  lobby.currentTurnIndex = (lobby.currentTurnIndex + 1) % lobby.players.length;
  return lobby.players[lobby.currentTurnIndex];
}
