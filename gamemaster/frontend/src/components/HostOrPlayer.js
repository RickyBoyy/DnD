import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import getSocket from "../socket";
import "../App.css";
import { io } from "socket.io-client";

const HostOrPlayer = () => {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [playerCode, setPlayerCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      console.log("Socket not connected, attempting to reconnect...");
      socket.connect();
    } else {
      console.log("Socket connected:", socket.id);
    }

    socket.on("lobbyError", (message) => {
      console.error("Lobby error received:", message);
      setErrorMessage(message);
    });

    socket.on("playerJoined", (players) => {
      console.log("Player joined the lobby:", players);
      navigate(`/lobby/${playerCode}`);
    });

    // Cleanup
    return () => {
      socket.off("lobbyError");
      socket.off("playerJoined");
    };
  }, [playerCode, navigate]);

  const getUsernameFromToken = () => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      console.error("Token is missing!");
      return null;
    }

    try {
      const decoded = jwtDecode(token);
      return decoded.username;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const handleHostClick = () => {
    const socket = getSocket();
    const username = getUsernameFromToken();
    if (!username) return;

    console.log("Creating lobby with username:", username);

    socket.emit("createLobby", { username });

    socket.on("lobbyCreated", ({ gameCode }) => {
      if (gameCode) {
        console.log("Lobby created with game code:", gameCode);
        navigate(`/lobby/${gameCode}`);
      } else {
        console.error("Failed to create a lobby. No game code received.");
      }
    });
  };
  const handlePlayerClick = () => {
    setShowCodeInput(true);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();

    const username = getUsernameFromToken();
    if (!username) return;

    console.log("Joining lobby with code:", playerCode);
    const socket = getSocket(); // Ensure socket is defined
    socket.emit("joinLobbyRoom", { gameCode: playerCode, username });
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
              <p>
                As a Host, you'll create a new Dungeons & Dragons game and
                invite others to join. You'll take on the role of the Dungeon
                Master, guiding the story, setting up challenges, and
                controlling the adventure for the players.
              </p>
            </div>
          </div>
          <div className="right_choice">
            <div className="card_player" onClick={handlePlayerClick}>
              <h2>Player</h2>
              <p>
                As a Player, you can join an existing Dungeons & Dragons game by
                entering a code provided by the Host. Once in, you’ll embark on
                an adventure, collaborate with other players, and face
                challenges together.
              </p>
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
            {errorMessage && (
              <div className="error_message">{errorMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostOrPlayer;
