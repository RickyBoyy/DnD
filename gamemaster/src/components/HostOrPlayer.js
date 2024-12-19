import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket"; // Use common socket instance
import "../App.css";

const HostOrPlayer = () => {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [playerCode, setPlayerCode] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // State to store error message
  const navigate = useNavigate();

  // Listen for 'lobbyError' event and set the error message
  useEffect(() => {
    // Listen for errors when joining the lobby
    socket.on("lobbyError", (message) => {
      setErrorMessage(message); // Update error message state
    });
  
    // Listen for successful player joining the lobby
    socket.on("playerJoined", (players) => {
      // Navigate to the lobby page after the player successfully joins
      navigate(`/lobby/${playerCode}`);
    });
  
    return () => {
      // Clean up socket listeners
      socket.off("lobbyError");
      socket.off("playerJoined");
    };
  }, [playerCode]); // playerCode needs to be in dependencies so it captures the correct code when joining
  

  const handleHostClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token is missing!");
      return;
    }

    try {
      const username = JSON.parse(atob(token.split('.')[1])).username;
      socket.emit("createLobby", { username }, (gameCode) => {
        navigate(`/lobby/${gameCode}`);
      });
    } catch (error) {
      console.error("Error decoding token or extracting username:", error);
    }
  };

  const handlePlayerClick = () => {
    setShowCodeInput(true);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Token is missing!");
      return;
    }

    try {
      const username = JSON.parse(atob(token.split('.')[1])).username;
      socket.emit("joinLobbyRoom", { gameCode: playerCode, username });
      // Don't navigate yet, we'll wait for the server response
    } catch (error) {
      console.error("Error decoding token or extracting username:", error);
    }
  };

  return (
    <div id="HostOrPlayer">
      <div className="main_choice_appearance">
        <div className="title_for_choice">
          <span>Make your Choice</span>
        </div>
        <div className="choices_available">
          <div className="left_choice">
            <div className="card_host" onClick={handleHostClick}>
              <h2>Host</h2>
              <p>As a Host, you'll create a new Dungeons & Dragons game and invite others to join. You'll take on the role of the Dungeon Master, guiding the story, setting up challenges, and controlling the adventure for the players.</p>
            </div>
          </div>
          <div className="right_choice">
            <div className="card_player" onClick={handlePlayerClick}>
              <h2>Player</h2>
              <p>As a Player, you can join an existing Dungeons & Dragons game by entering a code provided by the Host. Once in, you’ll embark on an adventure, collaborate with other players, and face challenges together.</p>
            </div>
          </div>
        </div>
      </div>

      {showCodeInput && (
        <div className="code_input_overlay">
          <div className="code_input_window">
            <h3>Enter Lobby Code</h3>
            <form onSubmit={handleCodeSubmit}>
              <input
                type="text"
                value={playerCode}
                onChange={(e) => setPlayerCode(e.target.value)}
                placeholder="Enter code here"
              />
              <button type="submit">Submit</button>
              <button type="button" onClick={() => setShowCodeInput(false)}>
                Cancel
              </button>
            </form>
            {errorMessage && <div className="error_message">{errorMessage}</div>} {/* Display error message */}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostOrPlayer;
