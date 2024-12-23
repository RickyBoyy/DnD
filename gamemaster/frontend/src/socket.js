import { io } from "socket.io-client";

// Ensure REACT_APP_SOCKET_URL is set in your environment (Docker, .env, etc.)
const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost";

const socket = io(socketUrl, {
  transports: ["websocket"],
  auth: {
    token: localStorage.getItem("token"),
    
  },
});


socket.on("connect", () => {
  console.log("Connected to WebSocket server:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message); // Debug connection issues
});

export default socket;
