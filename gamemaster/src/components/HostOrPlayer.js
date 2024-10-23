import React, { useState } from "react";

import "../App.css";

const HostOrPlayer = () => {
  return (
    <div id="HostOrPlayer">
      <div className="main_choice_appearance">
        <div className="title_for_choice">
          <h1>Make your Choice</h1>
        </div>
        <div className="choices_available">
          <div className="left_choice">
            <form className="card_host">
              <h2>Host</h2>
              <text>Some type of description for the the host</text>
            </form>
          </div>
          <div className="right_choice">
            <form className="card_player">
              <h2>Player</h2>
              <text>Some type of description for the player</text>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostOrPlayer;
