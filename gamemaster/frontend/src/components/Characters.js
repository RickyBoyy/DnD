import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const Characters = () => {
  const [characters, setCharacters] = useState([]); // State to store fetched characters
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharacters = async () => {
      const token = sessionStorage.getItem("token"); // Retrieve the token
      if (!token) {
        alert("You need to log in to view your characters.");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/getCharacters", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Characters:", data.characters); // Debugging fetched data
          setCharacters(data.characters); // Assuming server responds with { characters: [...] }
        } else {
          const errorText = await response.text();
          console.error("API Error:", errorText); // Debugging API error response
          alert("Failed to fetch characters.");
        }
      } catch (error) {
        console.error("Error fetching characters:", error);
        alert("An error occurred while fetching characters.");
      }
    };

    fetchCharacters();
  }, []);

  const navigateToCreateCharacter = () => {
    navigate("/createcharacter");
  };

  const navigateToProfile = () => {
    navigate("/profile"); // Navigate to the profile page
  };

  return (
    <div className="container">
      <div className="header-buttons">
        {/* Profile button */}
        <button className="profile-button" onClick={navigateToProfile}>
          Profile
        </button>

        {/* Create character button */}
        <button className="create-character-button" onClick={navigateToCreateCharacter}>
          Create Character
        </button>
      </div>

      <div className="title_characters">
        <span>Characters</span>
      </div>

      {/* Display each character dynamically */}
      {characters.length > 0 ? (
        characters.map((character) => (
          <div key={character.id} className="card_character">
            <div className="main_display">
              <div className="character-info">
                <img
                  src={character.image || "/path/to/default-image.jpg"} // Use character-specific image or default
                  alt="character_picture"
                  style={{
                    width: "150px",
                    height: "150px",
                    marginRight: "10px",
                  }}
                />
                <h4>{character.character_name}</h4>
              </div>
              <div className="character_content">
                <div className="character_background">
                  <p>{character.character_background || "No background provided."}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="collapsible"
              onClick={() => {
                character.isOpen = !character.isOpen;
                setCharacters([...characters]);
              }}
            >
              {character.isOpen ? "Close Collapsible" : "Open Collapsible"}
            </button>
            <div
              className="collapsible_content"
              style={{
                maxHeight: character.isOpen ? "300px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease",
              }}
            >
              <div className="stats-container">
                <div className="stat">Strength: {character.character_strength}</div>
                <div className="stat">Dexterity: {character.character_dexterity}</div>
                <div className="stat">Constitution: {character.character_constitution}</div>
                <div className="stat">Intelligence: {character.character_intelligence}</div>
                <div className="stat">Wisdom: {character.character_wisdom}</div>
                <div className="stat">Charisma: {character.character_charisma}</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No characters found. Create one to get started!</p>
      )}
    </div>
  );
};

export default Characters;
