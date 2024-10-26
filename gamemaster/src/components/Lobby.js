import React, { useState, useEffect } from "react";
import "../App.css";

const Lobby = () => {
  const [gameCode, setGameCode] = useState("");
  const [players, setPlayers] = useState(["Host"]); // Host is automatically added
  const maxPlayers = 6;

  useEffect(() => {
    // Generate a random game code on component mount
    setGameCode(generateGameCode());
  }, []);

  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const startGame = () => {
    if (players.length > 1) {
      alert("Game Started!");
    } else {
      alert("You need at least 2 players to start the game.");
    }
  };

  return (
    <div id="LobbyPage">
      <div className="lobby-container">
        <div className="lobby-title">
          <h1>D&D Game Lobby</h1>
        </div>

        <div className="game-code-section">
          <span className="game-code-label">Game Code:</span>
          <span className="game-code">{gameCode}</span>
        </div>

        <div className="player-slots">
          {[...Array(maxPlayers)].map((_, index) => (
            <div
              key={index}
              className={`player-slot ${index < players.length ? "filled" : "empty"}`}
            >
              {index < players.length ? players[index] : "Available"}
            </div>
          ))}
        </div>

        <button className="start-game-btn" onClick={startGame}>Start Game</button>
      </div>
    </div>
  );
};

export default Lobby;
