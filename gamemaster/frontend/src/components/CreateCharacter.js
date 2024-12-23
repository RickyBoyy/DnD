import React, { useState, useEffect } from "react";
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
  const [usedScores, setUsedScores] = useState([]);

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
    if (selectedRace) {
      fetch(`${API_BASE_URL}/races/${selectedRace.toLowerCase()}`)
        .then((response) => response.json())
        .then((data) => {
          const adjustments = { ...baseAbilityScores };
          data.ability_bonuses.forEach((bonus) => {
            const abilityKey = bonus.ability_score.index;
            adjustments[abilityKey] += bonus.bonus;
          });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const characterData = {
      name: characterName,
      race: selectedRace,
      class: selectedClass,
      alignment: alignment,
      abilities: abilities,
    };
    console.log("Character Created:", characterData);
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
            name="background"
            placeholder="Your character background"
            rows="5"
            cols="50"
            className="background-textarea"
          ></textarea>
        </div>
        <button className="ending_character_button">Create Character</button>
      </div>
    </div>
  );
};

export default CreateCharacter;
