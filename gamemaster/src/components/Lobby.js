import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import "../App.css";

const Lobby = () => {
  const { gameCode } = useParams();
  const [players, setPlayers] = useState([{ id: "hostId", name: "Host" }]); // Initialize with an object
  const maxPlayers = 6;

  useEffect(() => {
    console.log("Attempting to join lobby with game code:", gameCode);
    socket.emit("joinLobbyRoom", gameCode);
  
    socket.on("playerJoined", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
  
    socket.on("lobbyError", (message) => {
      alert(message);
    });
  
    return () => {
      socket.off("playerJoined");
      socket.off("lobbyError");
    };
  }, [gameCode]);
  

  const startGame = () => {
    if (players.length > 1) {
      alert("Game Started!");
      socket.emit("startGame", gameCode);
    } else {
      alert("At least 2 players are needed to start.");
    }
  };

  return (
    <div id="LobbyPage">
      <div className="lobby-container">
        <h1>D&D Game Lobby</h1>
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

        <button onClick={startGame}>Start Game</button>
      </div>
    </div>
  );
};

export default Lobby;
