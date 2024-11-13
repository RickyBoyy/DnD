require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const authController = require("./authController");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "http://localhost:3001", methods: ["GET", "POST"], credentials: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "build")));

// Store lobby data
const lobbies = {};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("createLobby", (callback) => {
    const gameCode = generateGameCode();
    lobbies[gameCode] = { players: ["Host"], hostId: socket.id };
    console.log("Lobby created with game code:", gameCode); // Log when a new lobby is created
    socket.join(gameCode);
    callback(gameCode);
  });
  
  socket.on("joinLobbyRoom", (gameCode) => {
    if (!lobbies[gameCode]) {
      console.log("Lobby does not exist:", gameCode); // Log when lobby doesn't exist
      socket.emit("lobbyError", "Lobby does not exist.");
      return;
    }
  
    const lobby = lobbies[gameCode];
  
    // Check if the player is already in the lobby
    if (!lobby.players.includes(socket.id) && lobby.players.length < 6) {
      const playerCount = lobby.players.length + 1;
      lobby.players.push(`Player ${playerCount}`);
      io.to(gameCode).emit("playerJoined", lobby.players);
      socket.join(gameCode);
    } else {
      console.log("Lobby is full or player already in the lobby:", gameCode); // Log when lobby is full
      socket.emit("lobbyError", "Lobby is full or player already in the lobby.");
    }
  });
  

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  
    // Remove the player from all lobbies they are in
    for (const gameCode in lobbies) {
      const lobby = lobbies[gameCode];
      const playerIndex = lobby.players.findIndex((player) => player.id === socket.id);
      
      if (playerIndex !== -1) {
        lobby.players.splice(playerIndex, 1); // Remove player
  
        // Notify others in the lobby
        io.to(gameCode).emit("playerJoined", lobby.players);
        
        // If no players remain, delete the lobby
        if (lobby.players.length === 0) {
          delete lobbies[gameCode];
        }
      }
    }
  });
});

// Helper function to generate a unique code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// API routes
app.post("/register", authController.register);
app.post("/login", authController.login);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
