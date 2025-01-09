import React, { useEffect, useState } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import getSocket from "../socket";

const Game = () => {
  const { gameCode } = useParams();
  const [players, setPlayers] = useState([]);
  const [gameIntroduction, setGameIntroduction] = useState("Waiting for game to start...");
  const [chatMessages, setChatMessages] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [processedResponses, setProcessedResponses] = useState(new Set());

  const addChatMessage = (message, className) => {
    setChatMessages((prevMessages) => {
      if (prevMessages.some((msg) => msg.message === message)) return prevMessages;
      return [...prevMessages, { message, className }];
    });
  };

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.error("Socket connection is not initialized.");
      return;
    }

    socket.emit("getPlayersInGame", gameCode);
    console.log(`Requesting players for gameCode: ${gameCode}`);

    const handleUpdatePlayers = (updatedPlayers) => {
      setPlayers(updatedPlayers);
      console.log("Players updated:", updatedPlayers);
    };

    const handleGameStarted = ({ introduction }) => {
      console.log("Game started event received:", { introduction });
      const introMessage = introduction || "Welcome to the adventure!";
      
      // Update introduction and set the game as started
      setGameIntroduction(introMessage);
      setIsGameStarted(true);
    };
    
    const handleGameStateUpdated = (updatedState) => {
      console.log("Game state updated:", updatedState);
      
      // Update players
      setPlayers(updatedState.players || []);
      
      // Set introduction only if it differs and the game hasn't started
      if (
        updatedState.introduction &&
        updatedState.introduction !== gameIntroduction &&
        !isGameStarted
      ) {
        setGameIntroduction(updatedState.introduction);
      }
    };
    

    const handleAIResponse = ({ player, action, response }) => {
      const responseId = `${player}-${action}-${response}`;
      if (processedResponses.has(responseId)) return;

      setProcessedResponses((prev) => new Set(prev).add(responseId));
      const playerMessage = player === playerName ? `You: ${action}` : `${player} performed: ${action}`;
      addChatMessage(playerMessage, "outgoing");
      addChatMessage(response, "incoming");
    };

    socket.on("connect", () => {
      console.log(`Socket connected with ID: ${socket.id}`);
      setPlayerName(socket.id);
    });

    socket.on("playersUpdated", handleUpdatePlayers);
    socket.on("playerJoined", handleUpdatePlayers);
    socket.on("playerLeft", handleUpdatePlayers);
    socket.on("gameStarted", handleGameStarted);
    socket.on("gameStateUpdated", handleGameStateUpdated);
    socket.on("aiResponse", handleAIResponse);

    return () => {
      socket.off("playersUpdated", handleUpdatePlayers);
      socket.off("playerJoined", handleUpdatePlayers);
      socket.off("playerLeft", handleUpdatePlayers);
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameStateUpdated", handleGameStateUpdated);
      socket.off("aiResponse", handleAIResponse);
    };
  }, [gameCode, gameIntroduction, isGameStarted, processedResponses, playerName]);

  const handleSendMessage = () => {
    const chatInput = document.querySelector("#chat-input");
    const input = chatInput.value.trim();

    if (!input) {
      addChatMessage("Please enter an action.", "error");
      return;
    }

    const socket = getSocket();
    if (!socket) {
      addChatMessage("Socket connection is not available.", "error");
      return;
    }

    addChatMessage(`You: ${input}`, "outgoing");

    socket.emit(
      "playerAction",
      { action: input, player: playerName, gameState: { players } },
      (response) => {
        if (response.success) {
          setGameIntroduction(response.introduction || gameIntroduction);
          addChatMessage(response.response, "incoming");
        } else {
          addChatMessage(response.response || "An error occurred.", "error");
        }
      }
    );

    chatInput.value = "";
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
        <div className="layout">
          <div className="players_display">
            <div className="side_nav">
              <span>Players</span>
              <div className="players_icons">
                {players.length > 0 ? (
                  players.map((player, index) => (
                    <div key={player.id || index} className="player_info">
                      <h3>{player.name || "Unknown Player"}</h3>
                    </div>
                  ))
                ) : (
                  <p>No players in the game yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="main-content">
            <div className="chat-container">
              <div className="chat introduction">
                <p>{gameIntroduction}</p>
              </div>
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat ${msg.className}`}>
                  {typeof msg.message === "string" ? (
                    <p>{msg.message}</p>
                  ) : (
                    <pre>{JSON.stringify(msg.message, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
            <div className="typing-container">
              <div className="typing-content">
                <div className="typing-textarea">
                  <textarea
                    id="chat-input"
                    placeholder="Enter your action..."
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
        </div>
      </div>
    </HelmetProvider>
  );
};

export default Game;
