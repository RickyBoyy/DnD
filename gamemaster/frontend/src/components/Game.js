import React, { useEffect, useState } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import getSocket from "../socket";
import initializeChat from "../scripts/chat";

const Game = () => {
  const { gameCode } = useParams();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const socket = getSocket();
  
    if (!socket) {
      console.error("Socket initialization failed.");
      return;
    }
  
    console.log("Requesting player list for game code:", gameCode);
    socket.emit("getPlayersInGame", gameCode);
  
    // Listen for player updates
    socket.on("playersUpdated", (updatedPlayers) => {
      console.log("Received updated players in game:", updatedPlayers);
      setPlayers(updatedPlayers); // Update player list
    });
  
    socket.on("playerJoined", (updatedPlayers) => {
      console.log("Player joined:", updatedPlayers);
      setPlayers(updatedPlayers); // Update player list
    });
  
    socket.on("playerLeft", (updatedPlayers) => {
      console.log("Player left:", updatedPlayers);
      setPlayers(updatedPlayers); // Update player list
    });
  
    document.body.style.overflow = "hidden";
  
    return () => {
      document.body.style.overflow = "auto";
      socket.off("playersUpdated");
      socket.off("playerJoined");
      socket.off("playerLeft");
    };
  }, [gameCode]); // Ensure gameCode is included in dependency array
  
  return (
    <HelmetProvider>
      <>
        <Helmet>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&text=delete,send,content_copy"
          />
        </Helmet>

        <div id="GameId">
          {/* Players Display */}
          <div className="players_display">
            <div className="side_nav">
              <span>Players</span>
              <div className="players_icons">
                {players.map((player, index) => (
                  <div key={index} className="player_info">
                    <img
                      src={player.avatar || ""}
                      alt={`${player.name || "Player"}_icon`}
                      style={{ width: "50px", height: "50px" }}
                    />
                    <h3>{player.name || "Unknown Player"}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat and Typing Area */}
          <div className="chat-container"></div>

          <div className="typing-container">
            <div className="typing-content">
              <div className="typing-textarea">
                <textarea
                  id="chat-input"
                  placeholder="Enter prompt here!!"
                  required
                ></textarea>
                <span id="send_btn" className="material-symbols-rounded">
                  send
                </span>
              </div>
              <div className="typing-controls">
                <span id="delete_btn" className="material-symbols-rounded">
                  delete
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    </HelmetProvider>
  );
};

export default Game;
