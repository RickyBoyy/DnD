import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import getSocket from "../socket";
import "../App.css";

const Lobby = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState("");
  const [isHost, setIsHost] = useState(false);
  const maxPlayers = 6;

  // UseEffect for setting up socket and fetching username from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = getSocket();

    if (!token) {
      console.error("Token not found in localStorage");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUsername(payload.username);
    } catch (error) {
      console.error("Error decoding token:", error);
    }

    // Attach socket event listeners
    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("playerJoined", (updatedPlayers) => {
      console.log("Player joined the lobby:", updatedPlayers);
      setPlayers(updatedPlayers);

      // Determine if the current user is the host
      const currentHost = updatedPlayers[0]?.name === username;
      console.log("Am I the host?", currentHost);
      setIsHost(currentHost);
    });

    socket.on("playerLeft", ({ players: updatedPlayers }) => {
      console.log("Players after player left:", updatedPlayers);
      setPlayers(updatedPlayers);

      // Update host status
      const currentHost = updatedPlayers[0]?.name === username;
      console.log("Am I the host?", currentHost);
      setIsHost(currentHost);
    });

    socket.on("gameStarted", ({ gameCode }) => {
      navigate(`/game/${gameCode}`);
    });

    // Emit joinLobbyRoom after listeners are attached
    if (username) {
      socket.emit("joinLobbyRoom", { gameCode, username });
    }

    return () => {
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("gameStarted");
    };
  }, [gameCode, username, navigate]);

  // Emit joinLobbyRoom after username is set (for reactivity)
  useEffect(() => {
    if (username) {
      const socket = getSocket();
      socket.emit("joinLobbyRoom", { gameCode, username });
    }
  }, [username, gameCode]);

  const startGame = () => {
    if (players.length > 1) {
      const socket = getSocket();
      socket.emit("startGame", gameCode);
    } else {
      alert("At least 2 players are needed to start.");
    }
  };

  return (
    <div id="LobbyPage">
      <div className="lobby-container">
        <h1 className="lobby-title">D&D Game Lobby</h1>
        <div className="game-code">Game Code: {gameCode}</div>

        <div className="player-slots">
          {console.log("Rendering players:", players)}
          {[...Array(maxPlayers)].map((_, index) => (
            <div
              key={index}
              className={`player-slot ${
                index < players.length
                  ? index === 0
                    ? "host"
                    : "filled"
                  : "empty"
              }`}
            >
              {index < players.length ? players[index].name : "Available"}
            </div>
          ))}
        </div>

        {/* Display Start Game Button only for the host */}
        {isHost && (
          <button className="start-game-btn" onClick={startGame}>
            Start Game
          </button>
        )}
      </div>
    </div>
  );
};

export default Lobby;
