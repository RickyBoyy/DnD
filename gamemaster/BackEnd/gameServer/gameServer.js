require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { spawn } = require("child_process");
const path = require("path");

const MAX_PLAYERS = 6;

// Directly create an HTTP server without using 'app'
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
  transports: ["websocket"],
});

const lobbies = {}; // Store lobbies in memory

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.username = null; // Initialize to ensure no stale username is attached

  const token = socket.handshake.auth.token;
  console.log("Received token:", token);
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
  }

  // Lobby management
  socket.on("createLobby", ({ username }, callback) => {
    console.log("Received createLobby event for username:", username);

    const gameCode = generateGameCode();
    console.log("Generated game code:", gameCode);

    // Save the lobby details
    lobbies[gameCode] = {
      players: [{ name: username, position: "Hall" }],
      enemies: [],
      map: {},
    };

    console.log("Lobby created. Current lobbies:", lobbies);

    // Ensure that the callback is a function before calling it
    if (typeof callback === "function") {
      console.log("Triggering callback with game code:", gameCode);
      callback(gameCode); // Send the game code back to the client
    } else {
      console.error("Callback is not a function or is undefined:", callback);
    }
  });
  socket.on("joinLobbyRoom", ({ gameCode, username }, callback) => {
    const lobby = lobbies[gameCode];

    if (!lobby) {
      return callback({ success: false, message: "Lobby not found." });
    }

    if (lobby.players.length >= MAX_PLAYERS) {
      return callback({ success: false, message: "Lobby is full." });
    }

    // Prepare data to send to GameMaster.py
    const pythonProcess = spawn("python", [
      path.join(__dirname, "GameMaster.py"),
    ]);

    const actionData = {
      action: "join",
      player: username,
      game_state: lobby.game_state || {},
      game_state: lobby.game_state || {},
    };

    let result = "";

    // Send action data to Python
    pythonProcess.stdin.write(JSON.stringify(actionData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (error) => {
      console.error("Error from Python:", error.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const response = JSON.parse(result); // Parse the response from Python

        // Check for any errors in the Python response
        if (response.error) {
          console.error("Error from Python response:", response.error);

          // Safeguard to ensure callback is a function
          if (typeof callback === "function") {
            callback({
              success: false,
              response: "Error: " + response.error,
            });
          } else {
            console.error(
              "Callback is not a function. Response: ",
              response.error
            );
          }
        } else {
          console.log("GameMaster response:", response);

          // Safeguard to ensure callback is a function
          if (typeof callback === "function") {
            callback({
              success: true,
              response: response.result, // Send the result from GameMaster.py
            });
          } else {
            console.error(
              "Callback is not a function. Response: ",
              response.result
            );
          }
        }
      } catch (error) {
        console.error("Error parsing Python response:", error);

        // Safeguard to ensure callback is a function
        if (typeof callback === "function") {
          callback({
            success: false,
            response: "Failed to process the action response.",
          });
        } else {
          console.error(
            "Callback is not a function. Error processing response:",
            error
          );
        }
      }
    });
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

    io.to(gameCode).emit("gameStarted", { gameCode });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    delete socket.username;

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
          console.log(`Lobby ${gameCode} deleted because it is empty.`);
        }
        break;
      }
    }
  });

  // Function for player actions
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

    const pythonProcess = spawn("python", [
      path.join(__dirname, "GameMaster.py"),
    ]);

    // Send action data to Python script
    const inputData = JSON.stringify(data);
    let result = "";

    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (error) => {
      console.error("Error from Python:", error.toString());
    });

    pythonProcess.on("close", () => {
      try {
        const response = JSON.parse(result); // Parse the response from Python

        // Check for any errors in the Python response
        if (response.error) {
          console.error("Error from Python response:", response.error);
          callback({
            success: false,
            response: "Error: " + response.error,
          });
        } else {
          console.log("GameMaster response:", response);
          callback({
            success: true,
            response: response.result, // Send the result from GameMaster.py
          });
        }
      } catch (error) {
        console.error("Error parsing Python response:", error);
        callback({
          success: false,
          response: "Failed to process the action response.",
        });
      }
    });
  });
});

// Function to generate a game code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.GAME_PORT || 3002;
server.listen(PORT, () =>
  console.log(`Game Server running on http://localhost:${PORT}`)
);
