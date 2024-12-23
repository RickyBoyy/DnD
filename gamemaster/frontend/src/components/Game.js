import React, { useEffect } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";

const Game = () => {
  useEffect(() => {
    const loadScript = (src, onLoad) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = onLoad;
      document.body.appendChild(script);
      return script;
    };

    const socketIoScript = loadScript(
      "https://cdn.socket.io/4.7.2/socket.io.min.js",
      () => {
        console.log("Socket.IO script loaded");

        loadScript("/scripts/chat.js", () => console.log("chat.js loaded"));
      }
    );

    document.body.style.overflow = "hidden";

    return () => {
      // Cleanup scripts and styles
      document.body.removeChild(socketIoScript);
      document.body.style.overflow = "auto";
    };
  }, []);

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
          <div className="players_display">
            <div className="side_nav">
              <span>Players</span>

              <div className="players_icons">
                <img
                  src=""
                  alt="player_icon"
                  style={{ width: "150px", height: "150px" }}
                />
                <h3>Player Name</h3>
              </div>
            </div>
          </div>
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
