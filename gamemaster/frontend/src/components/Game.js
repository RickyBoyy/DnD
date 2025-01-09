import React, { useEffect, useState } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import getSocket from "../socket";

const Game = () => {
  const { gameCode } = useParams();
  const [players, setPlayers] = useState([]);
  const [gameIntroduction, setGameIntroduction] = useState("");
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [characterSelections, setCharacterSelections] = useState({});

  const addChatMessage = (message, className) => {
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { message, className },
    ]);
  };

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    socket.emit("getPlayersInGame", gameCode);

    socket.on("connect", () => {
      setPlayerName(socket.id);
    });

    socket.on("playersUpdated", (updatedPlayers) => setPlayers(updatedPlayers));
    socket.on("playerJoined", (updatedPlayers) => setPlayers(updatedPlayers));
    socket.on("playerLeft", (updatedPlayers) => setPlayers(updatedPlayers));
    socket.on("turnUpdate", ({ player }) => setCurrentTurnPlayer(player));

    socket.on("gameStateUpdated", (updatedState) => {
      setPlayers((prevPlayers) =>
        Array.isArray(updatedState.players) ? updatedState.players : prevPlayers
      );
      setGameIntroduction(
        (prev) =>
          updatedState.introduction ||
          prev ||
          "Waiting for the game to start..."
      );
      setCurrentTurnPlayer((prev) => updatedState.currentTurnPlayer || prev);
    });

    socket.on("aiResponse", ({ player, action, response }) => {
      addChatMessage(`${player} performed: ${action}`, "outgoing");
      addChatMessage(response, "incoming");
    });

    socket.on(
      "gameStarted",
      ({ introduction, gameState, currentTurnPlayer, characterSelections }) => {
        console.log("Received gameStarted event:", {
          introduction,
          gameState,
          currentTurnPlayer,
          characterSelections,
        });

        if (introduction) {
          setGameIntroduction(introduction);
          addChatMessage(introduction, "incoming");
        } else {
          console.error("Introduction is missing from gameStarted event.");
        }

        if (gameState?.players) {
          setPlayers(gameState.players);
        } else {
          console.error("Players are missing from gameState.");
        }

        if (currentTurnPlayer) {
          setCurrentTurnPlayer(currentTurnPlayer);
        } else {
          console.error("Current turn player is missing.");
        }
        if (characterSelections) {
          setCharacterSelections(characterSelections);
        } else {
          console.error(
            "Character selections are missing from gameStarted event."
          );
        }
      }
    );

    return () => {
      socket.off("playersUpdated");
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("gameStarted");
      socket.off("turnUpdate");
      socket.off("aiResponse");
      socket.off("gameStateUpdated");
    };
  }, [gameCode]);

  const handleSendMessage = () => {
    const chatInput = document.querySelector("#chat-input");
    const message = chatInput.value.trim();
    if (message && currentTurnPlayer === playerName) {
      const socket = getSocket();
      console.log("Emitting playerAction:", {
        action: message,
        player: playerName,
      });
      addChatMessage(`You: ${message}`, "outgoing");
      socket.emit(
        "playerAction",
        { action: message, player: playerName },
        (response) => {
          console.log("Response from server:", response);
          if (response.success) {
            addChatMessage(response.response, "incoming");
          } else {
            addChatMessage("Error: " + response.response, "error");
          }
        }
      );
      chatInput.value = "";
    } else if (!message) {
      alert("Please enter an action.");
    } else {
      alert("It's not your turn!");
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&text=delete,send,content_copy"
        />
      </Helmet>
      <div id="GameId">
        <div className="players_display">
          <div className="turn-notification">
            {currentTurnPlayer && <p>It's {currentTurnPlayer}'s turn!</p>}
          </div>
          <div className="side_nav">
            <span>Players</span>
            <div className="players_icons">
              {players && players.length > 0 ? (
                players.map((player, index) => (
                  <div key={index} className="player_info">
                    <img
                      src={
                        characterSelections[player.name]?.image ||
                        "/default-image.jpg"
                      }
                      alt={`${player.name}'s character`}
                      className="player-character-icon"
                    />
                    <h3>{player.name || "Unknown Player"}</h3>
                  </div>
                ))
              ) : (
                <p>No players in the game yet.</p>
              )}
            </div>
          </div>
        </div>
        <div className="chat-container">
          {gameIntroduction ? (
            <div className="chat introduction">
              <p>{gameIntroduction}</p>
            </div>
          ) : (
            <p>Waiting for the game to start...</p>
          )}
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat ${msg.className}`}>
              <p>{msg.message}</p>
            </div>
          ))}
        </div>
        <div className="typing-container">
          <div className="typing-content">
            <div className="typing-textarea">
              <textarea
                id="chat-input"
                placeholder={
                  currentTurnPlayer !== playerName
                    ? "Wait for your turn..."
                    : "Enter prompt here!!"
                }
                disabled={currentTurnPlayer !== playerName}
                required
              ></textarea>
              <span
                id="send_btn"
                className="material-symbols-rounded"
                onClick={handleSendMessage}
              >
                send
              </span>
            </div>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
};

export default Game;
