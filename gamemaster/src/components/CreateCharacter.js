import React, { useState, useEffect } from "react";
import "../App.css";

// Base URL for DnD5e API
const API_BASE_URL = "https://www.dnd5eapi.co/api";

const CreateCharacter = () => {
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [characterName, setCharacterName] = useState("");

  // Fetch races and classes from the DnD5e API
  useEffect(() => {
    // Fetch races
    fetch(`${API_BASE_URL}/races`)
      .then((response) => response.json())
      .then((data) => setRaces(data.results))
      .catch((error) => console.error("Error fetching races:", error));

    // Fetch classes
    fetch(`${API_BASE_URL}/classes`)
      .then((response) => response.json())
      .then((data) => setClasses(data.results))
      .catch((error) => console.error("Error fetching classes:", error));
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const characterData = {
      name: characterName,
      race: selectedRace,
      class: selectedClass,
    };
    console.log("Character Created:", characterData);
    // You could add more actions here, such as saving the character to a database
  };

  return (
    <div id="CreateCharacter">
      <div className="player_character_creation_section">
        <span>Create Your Character</span>
        <div className="character_details">
          <form onSubmit={handleSubmit}>
            {/* Character Name Input */}
            <div className="form-group">
              <label htmlFor="characterName">Character Name:</label>
              <input
                type="text"
                id="characterName"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter your character's name"
                required
              />
            </div>

            {/* Race Selection */}
            <div className="form-group">
              <label htmlFor="raceSelect">Select Race:</label>
              <select
                id="raceSelect"
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                required
              >
                <option value="">--Choose a Race--</option>
                {races.map((race) => (
                  <option key={race.index} value={race.name}>
                    {race.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selection */}
            <div className="form-group">
              <label htmlFor="classSelect">Select Class:</label>
              <select
                id="classSelect"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
              >
                <option value="">--Choose a Class--</option>
                {classes.map((cls) => (
                  <option key={cls.index} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="submit-btn">
              Create Character
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCharacter;
