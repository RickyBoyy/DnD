import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import socket from "../socket"; // Ensure this points to the correct socket instance
import "../App.css";
import { io } from "socket.io-client";

const HostOrPlayer = () => {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [playerCode, setPlayerCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io("http://localhost:3002", {
      auth: {
        token: localStorage.getItem("token"), // Send the token for authentication if needed
      },
      withCredentials: true, // Ensure credentials (cookies) are sent if necessary
    });
    socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket.id);
    });

    // Log when the socket encounters an error
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Handle socket events
    socket.on("lobbyError", (message) => {
      setErrorMessage(message);
    });

    socket.on("playerJoined", (players) => {
      navigate(`/lobby/${playerCode}`);
    });

    // Cleanup
    return () => {
      socket.off("lobbyError");
      socket.off("playerJoined");
    };
  }, [playerCode]);

  const getUsernameFromToken = () => {
    const token = localStorage.getItem("token");
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
    console.log("Host button clicked");
    const username = getUsernameFromToken(); // Get the username from the token
    if (!username) return;

    console.log("Creating lobby with username:", username);

    // Emit the 'createLobby' event with username and a callback
    socket.emit("createLobby", { username }, (gameCode) => {
      console.log("Frontend callback triggered with game code:", gameCode);
      if (gameCode) {
        console.log("Navigating to:", `/lobby/${gameCode}`);
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
