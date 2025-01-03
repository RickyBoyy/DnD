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
                {players.length > 0 ? (
                  players.map((player, index) => (
                    <div key={index} className="player_info">
                      <img
                        src={player.avatar || "/path/to/default-image.jpg"} // Display avatar if available
                        alt={`${player.name || "Player"}_icon`}
                        style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                      />
                      <h3>{player.name || "Unknown Player"}</h3>
                      {player.selectedCharacter ? (
                        <div className="character_stats">
                          <p><strong>Character:</strong> {player.selectedCharacter.character_name}</p>
                          <p><strong>Race:</strong> {player.selectedCharacter.character_race}</p>
                          <p><strong>Class:</strong> {player.selectedCharacter.character_class}</p>
                          <p><strong>Level:</strong> {player.selectedCharacter.character_level}</p>
                          <p><strong>Stats:</strong></p>
                          <ul>
                            <li>Strength: {player.selectedCharacter.character_strength}</li>
                            <li>Dexterity: {player.selectedCharacter.character_dexterity}</li>
                            <li>Constitution: {player.selectedCharacter.character_constitution}</li>
                            <li>Intelligence: {player.selectedCharacter.character_intelligence}</li>
                            <li>Wisdom: {player.selectedCharacter.character_wisdom}</li>
                            <li>Charisma: {player.selectedCharacter.character_charisma}</li>
                          </ul>
                        </div>
                      ) : (
                        <p>No character selected.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No players in the game yet.</p>
                )}
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
