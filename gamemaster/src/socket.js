import { io } from "socket.io-client";

const token = localStorage.getItem("token");
const socket = io("http://localhost:3002", {
  auth: {
    token,
  },
});


export default socket;
