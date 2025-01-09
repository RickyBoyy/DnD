import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import getSocket from "../socket";
import "../App.css";

const Lobby = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterSelections, setCharacterSelections] = useState({});
  const maxPlayers = 6;

  useEffect(() => {
    const socket = getSocket();

    // Set up socket listeners
    socket.on("playerJoined", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("playerLeft", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    socket.on("characterSelected", (updatedSelections) => {
      console.log("Updated selections:", updatedSelections); // Debugging
      setCharacterSelections(updatedSelections);
    });

    socket.on("gameStarted", () => {
      navigate(`/game/${gameCode}`);
    });

    return () => {
      // Clean up socket listeners
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("characterSelected");
      socket.off("gameStarted");
    };
  }, [gameCode, navigate]);

  useEffect(() => {
    if (players.length > 0 && players[0].name === username) {
      setIsHost(true);
    } else {
      setIsHost(false);
    }
  }, [players, username]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUsername(payload.username);
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, []);

  useEffect(() => {
    if (username) {
      const socket = getSocket();
      socket.emit("joinLobbyRoom", { gameCode, username });
    }
  }, [username, gameCode]);

  const fetchCharacters = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/getCharacters", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters);
        console.log("Characters fetched:", data.characters);
      } else {
        alert("Failed to fetch characters.");
      }
    } catch (error) {
      console.error("Error fetching characters:", error);
    }
  };

  const startGame = () => {
    const allSelected = players.every((player) => {
      console.log(
        `Checking player ${player.name}:`,
        characterSelections[player.name]
      );
      return characterSelections[player.name];
    });

    if (!allSelected) {
      alert("All players must select a character before starting the game.");
      return;
    }

    const socket = getSocket();
    socket.emit("startGame", { gameCode, characterSelections });
  };

  const openCharacterModal = () => {
    fetchCharacters();
    setShowCharacterModal(true);
  };

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    console.log("Character selected:", character);
  };

  const confirmCharacterSelection = () => {
    if (!selectedCharacter) {
      alert("Please select a character.");
      return;
    }

    const socket = getSocket();
    socket.emit("characterSelected", {
      gameCode,
      username,
      character: selectedCharacter,
    });

    setShowCharacterModal(false);
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
                index < players.length
                  ? index === 0
                    ? "host"
                    : "filled"
                  : "empty"
              }`}
            >
              {index < players.length
                ? `${players[index].name} ${
                    characterSelections[players[index].name]
                      ? "(Ready)"
                      : "(Not Ready)"
                  }`
                : "Available"}
            </div>
          ))}
        </div>

        <button className="character-select-btn" onClick={openCharacterModal}>
          Select Character
        </button>

        {isHost && (
          <button className="start-game-btn" onClick={startGame}>
            Start Game
          </button>
        )}
      </div>

      {/* Character Selection Modal */}
      {showCharacterModal && (
        <div className="character-modal">
          <h2>Select Your Character</h2>
          <div className="character-list">
            {characters.map((character) => (
              <div
                key={character.id}
                className={`character-item ${
                  selectedCharacter?.id === character.id ? "selected" : ""
                }`}
                onClick={() => handleCharacterSelect(character)}
              >
                <img
                  src={character.image || "/default-image.jpg"}
                  alt={character.name}
                />
                <h4>{character.character_name}</h4>
              </div>
            ))}
          </div>
          <button onClick={confirmCharacterSelection}>Confirm</button>
        </div>
      )}
    </div>
  );
};

export default Lobby;
