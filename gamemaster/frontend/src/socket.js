import { io } from "socket.io-client";

const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost";

let socket;

const initializeSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("No token found. Socket connection will not be initialized.");
    return null;
  }

  console.log("Initializing socket with token:", token);

  const newSocket = io(socketUrl, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  newSocket.on("connect", () => {
    console.log("Connected to WebSocket server:", newSocket.id);
  });

  newSocket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
    if (err.message === "Unauthorized") {
      console.warn("Unauthorized token. Redirecting to login...");
      localStorage.clear();
      window.location.href = "/login"; // Replace with navigate("/login") in React component context
    }
  });

  newSocket.on("disconnect", () => {
    console.log("Socket disconnected.");
  });

  return newSocket;
};

// Improved getSocket to ensure the socket is always initialized properly
export const getSocket = () => {
  if (!socket || socket.disconnected) {
    console.log("Socket is disconnected or not initialized, creating a new one.");
    socket = initializeSocket();
  }
  return socket;
};


export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket connection terminated.");
  }
};

export default getSocket;
