import React from "react";
import dwarfImage from "../assets/dwarf_bard.jpeg";

const Characters = () => {
  return (
    <div className="container">
      <div className="title_characters">
        <span>Characters</span>
      </div>
      <div className="card_character">
        <div className="main_display">
          <div className="character-info">
            <img
              src={dwarfImage}
              alt="character_picture"
              style={{
                width: "150px",
                height: "150px",

                marginRight: "10px",
              }}
            />
            <h4>Character Name</h4>
          </div>
          <div className="character_content">
            <div className="character_background">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Possimus aspernatur molestias saepe adipisci a, quibusdam sint,
                facere aperiam eligendi praesentium asperiores ipsum
                perspiciatis nulla iste, aliquam ut cumque quisquam obcaecati?
              </p>
            </div>
          </div>
        </div>
        <button type="button" class="collapsible">
          Open Collapsible
        </button>
      </div>
    </div>
  );
};

export default Characters;
