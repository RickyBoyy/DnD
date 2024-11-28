import React, { useState, useEffect } from "react";
import dwarfImage from "../assets/dwarf_bard.jpeg";

const Characters = () => {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

  const toggleCollapsible = () => {
    setIsCollapsibleOpen(!isCollapsibleOpen);
  };

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
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Veritatis nemo numquam quae laudantium, aperiam laborum
                molestias eveniet ullam nostrum magni beatae blanditiis
                repellendus. Recusandae iure ipsam totam, necessitatibus
                mollitia aut. Lorem, ipsum dolor sit amet consectetur
                adipisicing elit. Praesentium sed maiores velit! Possimus omnis,
                nam nemo esse doloremque debitis provident quae soluta
                cupiditate magnam ab dolor similique modi temporibus! Quia.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="collapsible"
          onClick={toggleCollapsible}
        >
          {isCollapsibleOpen ? "Close Collapsible" : "Open Collapsible"}
        </button>
        <div
          className="collapsible_content"
          style={{
            maxHeight: isCollapsibleOpen ? "300px" : "0",
            overflow: "hidden",
            transition: "max-height 0.3s ease",
          }}
        ></div>
      </div>
    </div>
  );
};

export default Characters;
