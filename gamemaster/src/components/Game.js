import React, { useEffect } from "react";
import { HelmetProvider, Helmet } from "react-helmet-async";

const Game = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/scripts/chat.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
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
          <div className="chat-container">
            {/* 
            <div className="chat outgoing">
              <div className="chat-content">
                <div className="chat-details">
                  <img src="" alt="user-img" />
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Aut,
                    inventore.
                  </p>
                </div>
              </div>
            </div>

            <div className="chat incoming">
              <div className="chat-content">
                <div className="chat-details">
                  <img src="" alt="logo-img" />
                  <p>
                    Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                    Maiores, nemo.
                  </p>
                </div>
                <span className="material-symbols-rounded">content_copy</span>
              </div>
            </div>
            <div className="chat incoming">
              <div className="chat-content">
                <div className="chat-details">
                  <img src="" alt="logo-img" />
                  <div className="typing-animation">
                    <div className="typing-dot" style={{ "--delay": "0.2s" }}></div>
                    <div className="typing-dot" style={{ "--delay": "0.3s" }}></div>
                    <div className="typing-dot" style={{ "--delay": "0.4s" }}></div>
                  </div>
                </div>
                <span className="material-symbols-rounded">content_copy</span>
              </div>
            </div>
            */}
          </div>

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
