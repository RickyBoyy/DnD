require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { spawn } = require("child_process");
const authController = require("./authController");

const app = express();
const server = http.createServer(app);
const MAX_PLAYERS = 6;
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "build")));

const jwt = require("jsonwebtoken");

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("No token provided");

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
};

// Store lobby data
const lobbies = {}; // Store game lobbies in memory (should be persisted for production)

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.username = decoded.username;
      console.log("Token verified. Username:", socket.username);
    } catch (err) {
      console.error("Invalid token:", err.message);
      socket.disconnect();
      return;
    }
  } else {
    console.warn("No token provided. Disconnecting socket:", socket.id);
    socket.disconnect();
    return;
  }

  // Handle player actions
  socket.on("playerAction", (data, callback) => {
    console.log("Received playerAction:", data);
    if (data && data.action) {
      callback({
        success: true,
        message: `Action '${data.action}' processed for user '${socket.username}'`,
      });
    } else {
      callback({ success: false, message: "Invalid action data" });
    }
  });

  // Handle creating a new lobby
  socket.on("createLobby", (data, callback) => {
    const username = socket.username || "Unknown Host"; // Fallback if undefined
    const gameCode = generateGameCode();

    lobbies[gameCode] = {
      players: [{ id: socket.id, name: socket.username }], // Add host with username
      hostId: socket.id,
    };

    console.log(`Lobby created with game code: ${gameCode} by ${username}`);
    socket.join(gameCode);
    callback(gameCode);
  });

  // Handle joining an existing lobby
  socket.on("joinLobbyRoom", ({ gameCode, username }) => {
    console.log("Received joinLobbyRoom event with:", { gameCode, username });

    const lobby = lobbies[gameCode];

    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }

    if (!username) {
      console.error("Username is missing for socket ID:", socket.id);
      return socket.emit(
        "lobbyError",
        "Username is required to join the lobby."
      );
    }

    if (lobby.players.length >= MAX_PLAYERS) {
      return socket.emit("lobbyError", "Lobby is full.");
    }

    if (!lobby.players.some((player) => player.id === socket.id)) {
      lobby.players.push({ id: socket.id, name: username });
      console.log(`${username} joined lobby ${gameCode}`);
    }

    socket.join(gameCode);
    console.log("Current players in lobby:", lobby.players);
    io.to(gameCode).emit("playerJoined", lobby.players);
  });

  // Handle game actions
  socket.on("gameAction", (data, callback) => {
    const { action, player, target } = data;

    console.log(
      `Received game action: ${action} by ${player} targeting ${target}`
    );

    // Spawn Python process
    const pythonProcess = spawn("python", [
      "./gamemaster/Backend/GameMaster.py",
    ]);

    const input = JSON.stringify({ action, player, target });
    let result = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (error) => {
      console.error("Python Error:", error.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const response = JSON.parse(result); // Parse the response from Python
        console.log("Python Response:", response);
        callback({ success: true, response });
      } catch (error) {
        console.error("Error parsing Python response:", error);
        callback({
          success: false,
          error: "Invalid response from GameMaster.py",
        });
      }
    });

    // Send data to Python
    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();
  });

  // Handle starting the game
  socket.on("startGame", (gameCode) => {
    const lobby = lobbies[gameCode];

    if (!lobby) {
      return socket.emit("lobbyError", "Lobby not found.");
    }

    if (lobby.players.length < 2) {
      return socket.emit(
        "lobbyError",
        "At least 2 players are required to start the game."
      );
    }

    console.log(`Game started for lobby ${gameCode}`);
    io.to(gameCode).emit("gameStarted", { gameCode }); // Notify all players in the lobby
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    // Remove the player from all lobbies they are in
    for (const gameCode in lobbies) {
      const lobby = lobbies[gameCode];
      const playerIndex = lobby.players.findIndex(
        (player) => player.id === socket.id
      );

      if (playerIndex !== -1) {
        lobby.players.splice(playerIndex, 1); // Remove player
        io.to(gameCode).emit("playerLeft", lobby.players);

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
