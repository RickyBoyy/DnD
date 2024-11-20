import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSpring, animated } from "@react-spring/web";
import "../App.css";

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8080/rectangles")
      .then((response) => {
        setCharacters(response.data);
      })
      .catch((error) => {
        console.error("Error fetching characters:", error);
      });
  }, []);

  const handleExpand = (index) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  return (
    <div id="Characters" className="characters-container">
      <div className="player_characters">
        <span>Characters</span>
      </div>
      <div className="vertical-slider">
        {characters.map((character, index) => {
          const isExpanded = expandedIndex === index;

          const animationStyles = useSpring({
            height: isExpanded ? "100px" : "0px",
            opacity: isExpanded ? 1 : 0,
            config: { tension: 200, friction: 20 },
          });

          return (
            <div
              key={index}
              className={`rectangle ${isExpanded ? "expanded" : ""}`}
              onClick={() => handleExpand(index)}
            >
              <div className="rectangle-title">{character.title}</div>
              <animated.div
                style={animationStyles}
                className="rectangle-details"
              >
                {character.description}
              </animated.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Characters;
