import React, { useState } from "react";

import "../App.css";

const HostOrPlayer = () => {
  return (
    <div id="HostOrPlayer">
      <div className="main_choice_appearance">
        <div className="title_for_choice">
          <span>Make your Choice</span>
        </div>
        <div className="choices_available">
          <div className="left_choice">
            <form className="card_host">
              <div className="choice_title">
                <h2>Host</h2>
              </div>

              <p>
                Host a Dungeons and Dragons game for your friends using a
                shareable private key to start your online session and start an
                adventure
              </p>
            </form>
          </div>
          <div className="right_choice">
            <form className="card_player">
              <div className="choice_title_player">
                <h2>Player</h2>
              </div>
              <p>
                Join a Dungeons and Dragons game, use a key provided by a host
                and participate in a adventure
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostOrPlayer;
