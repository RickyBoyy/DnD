import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE_URL = "https://www.dnd5eapi.co/api";

const baseAbilityScores = {
  strength: 8,
  dexterity: 8,
  constitution: 8,
  intelligence: 8,
  wisdom: 8,
  charisma: 8,
};

const abilityCost = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 6,
};

const availableScores = [9, 10, 11, 12, 13, 14];

const CreateCharacter = () => {
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [alignment, setAlignment] = useState("");
  const [abilities, setAbilities] = useState({ ...baseAbilityScores });
  const [pointsRemaining, setPointsRemaining] = useState(27);
  const [background, setBackground] = useState("");
  const [usedScores, setUsedScores] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  const alignments = [
    "Lawful Good",
    "Neutral Good",
    "Chaotic Good",
    "Lawful Neutral",
    "True Neutral",
    "Chaotic Neutral",
    "Lawful Evil",
    "Neutral Evil",
    "Chaotic Evil",
  ];

  useEffect(() => {
    fetch(`${API_BASE_URL}/races`)
      .then((response) => response.json())
      .then((data) => setRaces(data.results))
      .catch((error) => console.error("Error fetching races:", error));

    fetch(`${API_BASE_URL}/classes`)
      .then((response) => response.json())
      .then((data) => setClasses(data.results))
      .catch((error) => console.error("Error fetching classes:", error));
  }, []);
  useEffect(() => {
    console.log("Abilities updated: ", abilities);
  }, [abilities]);

  useEffect(() => {
    const abilityMapping = {
      str: "strength",
      dex: "dexterity",
      con: "constitution",
      int: "intelligence",
      wis: "wisdom",
      cha: "charisma",
    };

    if (selectedRace) {
      fetch(`${API_BASE_URL}/races/${selectedRace.toLowerCase()}`)
        .then((response) => response.json())
        .then((data) => {
          const adjustments = { ...baseAbilityScores };

          // Map ability bonuses from API to state keys
          data.ability_bonuses.forEach((bonus) => {
            const abilityKey = abilityMapping[bonus.ability_score.index];
            if (abilityKey) {
              adjustments[abilityKey] += bonus.bonus;
            }
          });

          // Update state with adjusted abilities and remaining points
          setAbilities(adjustments);
          setPointsRemaining(27 - calculateTotalCost(adjustments));
        })
        .catch((error) =>
          console.error("Error fetching race adjustments:", error)
        );
    }
  }, [selectedRace]);

  const calculateTotalCost = (currentAbilities) => {
    return Object.keys(currentAbilities).reduce((total, key) => {
      return total + (abilityCost[currentAbilities[key]] || 0);
    }, 0);
  };

  const handleAbilityChange = (ability, value) => {
    if (value < 9 || value > 14) return;

    const costBefore = abilityCost[abilities[ability]] || 0;
    const costAfter = abilityCost[value];
    const newPointsRemaining = pointsRemaining - costAfter + costBefore;

    if (newPointsRemaining >= 0) {
      setAbilities((prevAbilities) => ({
        ...prevAbilities,
        [ability]: value,
      }));
      setUsedScores((prevUsedScores) => {
        const newUsedScores = prevUsedScores.filter(
          (score) => score !== abilities[ability]
        );
        newUsedScores.push(value);
        return newUsedScores;
      });
      setPointsRemaining(newPointsRemaining);
    }
  };

  const navigate = useNavigate();

  const handleProfileImageChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleProfileImageUpload = async () => {
    if (!profileImage) {
      alert("Please select a profile image to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", profileImage);

    try {
      const response = await fetch("http://localhost:5000/uploadProfileImage", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("Profile image uploaded successfully!");
        setProfileImageUrl(data.profileImageUrl);
      } else {
        alert(data.message || "Failed to upload profile image.");
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      alert("An error occurred while uploading the profile image.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("You need to log in to create a character.");
      return;
    }

    const characterData = {
      name: characterName,
      race: selectedRace,
      class_cr: selectedClass,
      alignment: alignment,
      strength: abilities.strength,
      dexterity: abilities.dexterity,
      constitution: abilities.constitution,
      intelligence: abilities.intelligence,
      wisdom: abilities.wisdom,
      charisma: abilities.charisma,
      ch_background: background,
      profileImageUrl: profileImageUrl,
    };

    try {
      const response = await fetch("http://localhost:5000/createCharacter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(characterData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Character created successfully!");
        navigate("/characters");
      } else {
        alert(data.message || "Failed to create character.");
      }
    } catch (error) {
      console.error("Error creating character:", error);
      alert("An error occurred while creating the character.");
    }
  };

  return (
    <div id="CreateCharacter">
      <div className="player_character_title">
        <span>Create Your Character</span>
      </div>
      <div className="create_the_character">
        <div className="all_details">
          <div className="character_details">
            <form onSubmit={handleSubmit}>
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

              <div className="form-group">
                <label htmlFor="profileImage">Profile Image:</label>
                <input type="file" onChange={handleProfileImageChange} />
                <button type="button" onClick={handleProfileImageUpload}>
                  Upload Profile Image
                </button>
                {profileImageUrl && (
                  <div>
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="profile-preview"
                      style={{ width: "100px", height: "100px" }}
                    />
                  </div>
                )}
              </div>

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
                    <option key={race.index} value={race.index}>
                      {race.name}
                    </option>
                  ))}
                </select>
              </div>

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
                    <option key={cls.index} value={cls.index}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="alignmentSelect">Select Alignment:</label>
                <select
                  id="alignmentSelect"
                  value={alignment}
                  onChange={(e) => setAlignment(e.target.value)}
                  required
                >
                  <option value="">--Choose an Alignment--</option>
                  {alignments.map((align) => (
                    <option key={align} value={align}>
                      {align}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>

          <div className="character_abilities">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                {Object.keys(baseAbilityScores).map((ability) => (
                  <div key={ability} className="ability-group">
                    <label htmlFor={ability}>
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}:
                    </label>
                    <select
                      id={ability}
                      value={abilities[ability] || ""}
                      onChange={(e) =>
                        handleAbilityChange(ability, parseInt(e.target.value))
                      }
                      required
                    >
                      <option value="">--Choose Ability Score--</option>
                      {availableScores
                        .filter(
                          (score) =>
                            !usedScores.includes(score) ||
                            score === abilities[ability]
                        )
                        .map((score) => (
                          <option key={score} value={score}>
                            {score}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>
        <div className="character_background">
          <label>Character Background</label>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Your character background"
            rows="5"
            cols="50"
            className="background-textarea"
          />
        </div>
        <button
          className="ending_character_button"
          type="submit"
          onClick={handleSubmit}
        >
          Create Character
        </button>
      </div>
    </div>
  );
};

export default CreateCharacter;
