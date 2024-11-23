import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket"; // Use common socket instance
import "../App.css";

const HostOrPlayer = () => {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [playerCode, setPlayerCode] = useState("");
  const navigate = useNavigate();

  const handleHostClick = () => {
    socket.emit("createLobby", (gameCode) => {
      navigate(`/lobby/${gameCode}`);
    });
  };

  const handlePlayerClick = () => {
    setShowCodeInput(true);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    navigate(`/lobby/${playerCode}`);
    setShowCodeInput(false);
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
          </div>
        </div>
      )}
    </div>
  );
};

export default HostOrPlayer;
