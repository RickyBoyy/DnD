import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import dwarfImage from "../assets/dwarf_bard.jpeg";
import "../App.css";

const Characters = () => {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const navigate = useNavigate();

  const toggleCollapsible = () => {
    setIsCollapsibleOpen(!isCollapsibleOpen);
  };

  const navigateToCreateCharacter = () => {
    navigate("/createcharacter"); // Navegar para CreateCharactersPage
  };

  return (
    <div className="container">
      {/* Botão no canto superior direito */}
      <button className="create-character-button" onClick={navigateToCreateCharacter}>
        Create Character
      </button>

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
        >
          <div className="stats-container">
            <div className="stat">Strength:</div>
            <div className="stat">Dexterity:</div>
            <div className="stat">Constitution:</div>
            <div className="stat">Intelligence:</div>
            <div className="stat">Wisdom:</div>
            <div className="stat">Charisma:</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Characters;
