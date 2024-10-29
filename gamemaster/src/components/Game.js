import React from "react";
import { Helmet } from "react-helmet";

const Game = () => {
  return (
    <>
      <Helmet>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=delete"
        />
      </Helmet>

      <div id="GameId">
        <div className="chat-container">
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
                <div className="typing-animation">
                  <div
                    className="typing-dot"
                    style={{ "--delay": "0.2s" }}
                  ></div>
                  <div
                    className="typing-dot"
                    style={{ "--delay": "0.3s" }}
                  ></div>
                  <div
                    className="typing-dot"
                    style={{ "--delay": "0.4s" }}
                  ></div>
                </div>
              </div>
              <span className="material-symbols-outlined">content_copy</span>
            </div>
          </div>
        </div>
        <div className="typing-container">
          <div className="typing-content">
            <div className="typing-textarea">
              <textarea
                id="chat-input"
                placeholder="Enter prompt here!!"
              ></textarea>
              <span id="send_btn" className="material-symbols-outlined">
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
  );
};

export default Game;
