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
const MAX_PLAYERS = 6;
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "http://localhost:3001", methods: ["GET", "POST"], credentials: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "build")));

const jwt = require("jsonwebtoken");

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ message: "No token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = decoded; // Attach decoded user info to the request
    next(); // Proceed to the route handler
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Store lobby data
const lobbies = {}; // Store game lobbies in memory (should be persisted for production)

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  const token = socket.handshake.auth.token; // Token sent in auth query
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.username = decoded.username; // Attach username to the socket object
      console.log(`User authenticated: ${socket.username}`);
    } catch (err) {
      console.error("Invalid token:", err.message);
    }
  }

  // Handle creating a new lobby
  socket.on("createLobby", ({ username }, callback) => {
    const gameCode = generateGameCode(); // Function to generate a random game code
    const newLobby = {
      gameCode,
      players: [{ id: socket.id, name: username }],
    };

    lobbies[gameCode] = newLobby; // Store lobby in memory
    console.log(`Lobby created with game code: ${gameCode} by ${username}`);
    callback(gameCode); // Return game code to the host
  });

  // Handle joining an existing lobby
  socket.on("joinLobbyRoom", ({ gameCode, username }) => {
    console.log("Received joinLobbyRoom event with:", { gameCode, username });

    if (!username) {
      username = socket.username; // Fallback to the username attached to the socket
    }

    const lobby = lobbies[gameCode];

    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }

    if (lobby.players.length >= MAX_PLAYERS) {
      return socket.emit("lobbyError", "Lobby is full.");
    }

    // Add player to the lobby
    if (!lobby.players.some((player) => player.id === socket.id)) {
      lobby.players.push({ id: socket.id, name: username });
      console.log(`${username} joined lobby ${gameCode}`);
    }

    socket.join(gameCode);
    io.to(gameCode).emit("playerJoined", lobby.players);
  });

  // Handle disconnecting player
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const gameCode in lobbies) {
      const lobby = lobbies[gameCode];
      const playerIndex = lobby.players.findIndex((player) => player.id === socket.id);

      if (playerIndex !== -1) {
        lobby.players.splice(playerIndex, 1); // Remove player
        io.to(gameCode).emit("playerLeft", lobby.players);

        if (lobby.players.length === 0) {
          delete lobbies[gameCode]; // Delete the lobby if no players are left
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
app.post("/set-username", authController.setUsername);
app.get("/profile", authenticate, authController.getProfile);
app.post("/createCharacter", authController.createCharacter);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
