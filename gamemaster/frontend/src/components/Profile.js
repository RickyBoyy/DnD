import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [characters, setCharacters] = useState([]); // State for user characters
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          throw new Error("No token found");
        }

        const [profileResponse, charactersResponse] = await Promise.all([
          axios.get("http://localhost:5000/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get("http://localhost:5000/getCharacters", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        setProfile(profileResponse.data);
        setCharacters(charactersResponse.data.characters || []);
      } catch (error) {
        console.error("Error fetching data", error);
        setError(error.response?.data?.message || "Error fetching data");
      }
    };

    fetchUserData();
  }, []);

  const handlePlayButtonClick = () => {
    if (characters.length > 0) {
      navigate("/hostorplayer");
    }
  };

  const handleNavigateCharacter = () => {
    navigate("/characters");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setProfile(null);
    navigate("/login");
  };

  if (error) {
    return (
      <div className="profile-container centered">
        <div className="error-card">
          <h2 className="error-title">Oops! Something went wrong.</h2>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container centered">
        <div className="loading-card">
          <p className="loading-message">Fetching your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container centered">
      <div className="profile-card">
        <h1 className="dnd-title">Adventurer's Profile</h1>
        <div className="decorative-flair">Heroic Stats</div>
        <div className="profile-info">
          <p>
            <span className="info-label">Username:</span> {profile.username}
          </p>
          <p>
            <span className="info-label">Email:</span> {profile.email}
          </p>
        </div>
        <div className="decorative-flair">Quest Log</div>
        <div className="no-quests-message">
          <p>You have not embarked on any quests yet. Start your journey now!</p>
        </div>
      </div>


      {/* Buttons outside the card */}
      <div className="buttons-container">
        <button className="play-button" onClick={handlePlayButtonClick}>
          Play
        </button>
        <button
          className="character-button"
          onClick={handleNavigateCharacter}
        >
          Your Characters
        </button>
      </div>

      {/* Floating Play Button */}
      <button
        className="play-button"
        onClick={handlePlayButtonClick}
        disabled={characters.length === 0} // Disable if no characters
      >
        Play
      </button>

      {/* Navigate Home Button */}
      <button className="character-button" onClick={handleNavigateCharacter}>
        Your Characters
      </button>

      {/* Logout Button */}
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>

      {/* Inform the user if no characters exist */}
      {characters.length === 0 && (
        <p className="no-characters-message">
          You need to create a character to play!
        </p>
      )}

    </div>
  );
};

export default Profile;
