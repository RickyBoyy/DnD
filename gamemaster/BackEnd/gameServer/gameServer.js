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
      players: [{ id: socket.id, name: username, isHost: true }],
    };
    lobbies[gameCode] = lobby;
    socket.join(gameCode);

    // Emit the game code back to the host
    socket.emit("lobbyCreated", { gameCode, host: username, players: lobby.players });

    // Emit `playerJoined` with the initial list
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

    lobby.players.push({ id: socket.id, name: username, isHost: false });
    socket.join(gameCode);

    console.log("Updated players in lobby:", lobby.players);

    // Emit the updated players list to everyone in the room
    io.to(gameCode).emit("playerJoined", lobby.players);
    io.to(gameCode).emit("playersUpdated", lobby.players);

    // Explicitly emit the updated list to the new player
    socket.emit("playerJoined", lobby.players);
  });

  socket.on("startGame", (gameCode) => {
    const lobby = lobbies[gameCode];
    if (!lobby || lobby.players.length < 2) {
      return socket.emit("lobbyError", "At least 2 players are required.");
    }

    // Now emit `playersUpdated` only after the game starts
    io.to(gameCode).emit("playersUpdated", lobby.players);

    // Emit `gameStarted` event to all players in the game
    io.to(gameCode).emit("gameStarted", { gameCode });
  });

  socket.on("getPlayersInGame", (gameCode) => {
    const lobby = lobbies[gameCode];
    if (!lobby) {
      console.log("Lobby not found for gameCode:", gameCode);
      return socket.emit("lobbyError", "Lobby not found.");
    }
  
    // Emit the current players in the lobby
    socket.emit("playersUpdated", lobby.players); // Send to the requesting player
    console.log("Sent players list for game code:", gameCode);
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

  // Player actions
  socket.on("playerAction", (data, callback) => {
    console.log("Received playerAction:", data);
    console.log("Callback function:", callback);

    if (typeof callback !== "function") {
      console.error("Callback is not a function");
      return;
    }

    if (data && data.action) {
      const successMessage = `Action '${data.action}' processed for user '${socket.username}'`;

      const response = {
        success: true,
        response: successMessage,
        game_state: {
          /* Updated game state data */
        },
      };

      callback(response);
    } else {
      const errorResponse = {
        success: false,
        error: "Invalid action data",
      };

      callback(errorResponse);
    }
  });
});

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});

function generateGameCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}
