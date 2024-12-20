require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { spawn } = require("child_process");
const authController = require("./authController");

const app = express();
const server = http.createServer(app);
const MAX_PLAYERS = 6;
const io = require("socket.io")(server, {
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
    // Log the incoming request for debugging
    console.log("Incoming request:", {
      method: req.method,
      url: req.url,
      headers: req.headers,
    });

    // Check for the Authorization header and extract the token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.error("No token provided in the Authorization header");
      throw new Error("No token provided");
    }

    console.log("Token extracted:", token);

    // Verify the token
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified. Decoded user info:", req.user);

    // Proceed to the next middleware or route
    next();
  } catch (err) {
    console.error("Authentication error:", err.message || "Unauthorized");
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
};

const lobbies = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  const token = socket.handshake.auth?.token;
  console.log("Received token:", token);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified. Username:", decoded.username);
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

  socket.on("createLobby", (data, callback) => {
    const username = socket.username || "Unknown Host";
    const gameCode = generateGameCode();

    lobbies[gameCode] = {
      players: [{ id: socket.id, name: socket.username }],
      hostId: socket.id,
    };

    console.log(`Lobby created with game code: ${gameCode} by ${username}`);
    socket.join(gameCode);
    callback(gameCode);
  });

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

  socket.on("gameAction", (data, callback) => {
    const { action, player, target } = data;

    if (!action || !player) {
      return callback({
        success: false,
        message: "Invalid action or player data",
      });
    }

    console.log(
      `Received game action: ${action} by ${player} targeting ${target}`
    );

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
        const response = JSON.parse(result);
        console.log("Python Response:", response);

        if (response.error) {
          return callback({ success: false, message: response.error });
        }

        callback({ success: true, response });
      } catch (error) {
        console.error("Error parsing Python response:", error);
        callback({
          success: false,
          error: "Invalid response from GameMaster.py",
        });
      }
    });

    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();
  });

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
    io.to(gameCode).emit("gameStarted", { gameCode });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const gameCode in lobbies) {
      const lobby = lobbies[gameCode];
      const playerIndex = lobby.players.findIndex(
        (player) => player.id === socket.id
      );

      if (playerIndex !== -1) {
        lobby.players.splice(playerIndex, 1);
        io.to(gameCode).emit("playerLeft", lobby.players);

        if (lobby.players.length === 0) {
          delete lobbies[gameCode];
        }
      }
    }
  });
});

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
