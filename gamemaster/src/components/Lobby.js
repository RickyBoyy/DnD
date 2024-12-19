import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import "../App.css";

const Lobby = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate(); // React Router's navigation hook
  const [players, setPlayers] = useState([{ id: "hostId", name: "Host" }]);
  const [username, setUsername] = useState("");
  const maxPlayers = 6;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Token not found in localStorage");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode the payload
      setUsername(payload.username);
    } catch (error) {
      console.error("Error decoding token:", error);
    }

    // Emit joinLobbyRoom event after retrieving the username
    socket.emit("joinLobbyRoom", { gameCode, username });

    // Handle playerJoined event to update the player list
    socket.on("playerJoined", (updatedPlayers) => {
      setPlayers(updatedPlayers); // Update the players state
    });

    // Handle playerLeft event to update the player list when a player leaves
    socket.on("playerLeft", (updatedPlayers) => {
      setPlayers(updatedPlayers); // Update the players state
    });

    // Listen for the gameStarted event to navigate all players to the game page
    socket.on("gameStarted", ({ gameCode }) => {
      navigate(`/game/${gameCode}`); // Navigate to the game page
    });

    // Clean up socket listeners when component is unmounted
    return () => {
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("gameStarted");
    };
  }, [gameCode, username, navigate]);

  const startGame = () => {
    if (players.length > 1) {
      socket.emit("startGame", gameCode); // Notify server to start the game
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
          {[...Array(maxPlayers)].map((_, index) => (
            <div
              key={index}
              className={`player-slot ${
                index < players.length ? (index === 0 ? "host" : "filled") : "empty"
              }`}
            >
              {index < players.length ? players[index].name : "Available"}
            </div>
          ))}
        </div>

        <button className="start-game-btn" onClick={startGame}>
          Start Game
        </button>
      </div>
    </div>
  );
};

export default Lobby;
