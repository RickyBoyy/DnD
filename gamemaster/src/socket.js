// src/socket.js
import { io } from "socket.io-client";

// Initialize socket instance only once
const socket = io("http://localhost:3000", {
  autoConnect: false, // Optional: Prevents auto-connection on import
});

export default socket;
