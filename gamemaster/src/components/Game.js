import React from "react";

const Game = () => {
  return (
    <div id="game_id">
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
                <div className="typing-dot" style={{ "--delay": "0.2s" }}></div>
                <div className="typing-dot" style={{ "--delay": "0.3s" }}></div>
                <div className="typing-dot" style={{ "--delay": "0.4s" }}></div>
              </div>
            </div>
            <span className="material-symbols-rounded">content-copy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
