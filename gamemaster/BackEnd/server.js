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
const lobbies = {};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("createLobby", (callback) => {
    const gameCode = generateGameCode();
    // Initialize the lobby with no players; only store the host's socket ID for reference
    lobbies[gameCode] = { players: [], hostId: socket.id };
    console.log("Lobby created with game code:", gameCode);
    
    // Host joins their own lobby after creation
    socket.join(gameCode);
    callback(gameCode);
  });
  
  socket.on("joinLobbyRoom", ({ gameCode, username }) => {
    if (!lobbies[gameCode]) {
      socket.emit("lobbyError", "Lobby does not exist.");
      return;
    }
  
    const lobby = lobbies[gameCode];
    if (lobby.players.length >= 6) {
      socket.emit("lobbyError", "Lobby is full.");
      return;
    }
  
    const newPlayer = { id: socket.id, name: username || `Player ${lobby.players.length + 1}` };
    lobby.players.push(newPlayer);
    socket.join(gameCode);
  
    io.to(gameCode).emit("playerJoined", lobby.players);
    
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

app.post("/set-username", authController.setUsername);
app.get("/profile", authenticate, authController.getProfile);




app.post("/createCharacter", authController.createCharacter);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
