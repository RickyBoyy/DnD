import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import getSocket from "../socket";
import "../App.css";

const Lobby = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate(); // To navigate to the game page
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState("");
  const [isHost, setIsHost] = useState(false);
  const maxPlayers = 6;

  // UseEffect for setting up socket and fetching username from token
  useEffect(() => {
    const socket = getSocket();

    // Clear existing listeners to avoid duplicates
    socket.off("playerJoined");
    socket.off("playerLeft");
    socket.off("gameStarted"); // Listen for game start

    // Attach new listeners
    socket.on("playerJoined", (updatedPlayers) => {
      console.log("Received updated players:", updatedPlayers);
      setPlayers(updatedPlayers);
    });

    socket.on("playerLeft", ({ players: updatedPlayers }) => {
      console.log("Player left the lobby:", updatedPlayers);
      setPlayers(updatedPlayers);
    });

    // Listen for the game started event to navigate all players
    socket.on("gameStarted", () => {
      navigate(`/game/${gameCode}`);
    });

    return () => {
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("gameStarted");
    };
  }, [gameCode, navigate]); // Empty dependency array ensures this runs only once on mount

  // UseEffect to update `isHost` whenever `players` or `username` changes
  useEffect(() => {
    if (players.length > 0 && players[0].name === username) {
      setIsHost(true);
    } else {
      setIsHost(false);
    }
  }, [players, username]);

  // UseEffect to fetch username from token
  useEffect(() => {
    const token = localStorage.getItem("token");
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
  }, []);

  // Emit joinLobbyRoom after username is set (for reactivity)
  useEffect(() => {
    if (username) {
      const socket = getSocket();
      console.log(
        `Emitting joinLobbyRoom with gameCode: ${gameCode} and username: ${username}`
      );
      socket.emit("joinLobbyRoom", { gameCode, username });
    }
  }, [username, gameCode]); // Ensure dependency on `username`

  const startGame = () => {
    if (players.length > 1) {
      const socket = getSocket();
      socket.emit("startGame", gameCode); // Notify the server to start the game
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
