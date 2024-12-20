require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

const MAX_PLAYERS = 6;

const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Update this if your frontend runs elsewhere
    methods: ["GET", "POST"],
  },
});

const lobbies = {}; // Store lobbies in memory

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.username = null; // Initialize to ensure no stale username is attached

  const token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.username = decoded.username;
      console.log(`User authenticated: ${socket.username}`);
    } catch (err) {
      console.error("Invalid token:", err.message);
      socket.emit("lobbyError", "Authentication failed. Invalid token.");
      return socket.disconnect(true);
    }
  } else {
    console.error("Token missing in socket handshake.");
    socket.emit("lobbyError", "Authentication failed. Token missing.");
    return socket.disconnect(true);
  }

  // Lobby management
  socket.on("createLobby", ({ username }, callback) => {
    const gameCode = generateGameCode();
    const newLobby = {
      gameCode,
      players: [{ id: socket.id, name: username }],
    };
  
    lobbies[gameCode] = newLobby; // Ensure this is set
    callback(gameCode); // Ensure the callback sends the game code
  });
  
  socket.on("joinLobbyRoom", ({ gameCode, username }) => {
    const lobby = lobbies[gameCode];
  
    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }
    if (lobby.players.length >= MAX_PLAYERS) {
      return socket.emit("lobbyError", "Lobby is full.");
    }
  
    // Check if the player is already in the lobby
    if (!lobby.players.some((player) => player.id === socket.id)) {
      lobby.players.push({ id: socket.id, name: username });
      console.log(`${username} joined lobby ${gameCode}`);
    }
  
    // Join the socket.io room for the lobby
    socket.join(gameCode);
  
    // Notify all players in the lobby about the updated player list
    io.to(gameCode).emit("playerJoined", lobby.players);
  });
  

  socket.on("startGame", (gameCode) => {
    const lobby = lobbies[gameCode];
    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }
    if (lobby.players.length < 2) {
      return socket.emit("lobbyError", "At least 2 players are required to start the game.");
    }

    io.to(gameCode).emit("gameStarted", { gameCode });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  
    // Clean up the socket's username to prevent stale data
    delete socket.username;
  
    // Remove the player from any lobbies they were part of
    for (const gameCode in lobbies) {
      const lobby = lobbies[gameCode];
      const playerIndex = lobby.players.findIndex((player) => player.id === socket.id);
  
      if (playerIndex !== -1) {
        lobby.players.splice(playerIndex, 1);
        io.to(gameCode).emit("playerLeft", lobby.players);
  
        // Delete the lobby if no players remain
        if (lobby.players.length === 0) {
          delete lobbies[gameCode];
          console.log(`Lobby ${gameCode} deleted because it is empty.`);
        }
        break; // Stop checking once we found the player
      }
    }
  });
  
});

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.GAME_PORT || 3002;
server.listen(PORT, () =>
  console.log(`Game Server running on http://localhost:${PORT}`)
);
