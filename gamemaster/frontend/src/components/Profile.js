import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("http://localhost:5000/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile", error);
        setError(error.response?.data?.message || "Error fetching profile");
      }
    };

    fetchUserData();
  }, []);

  const handlePlayButtonClick = () => {
    navigate("/hostorplayer");
  };

  const handleNavigateCharacter = () => {
    navigate("/characters");
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
    </div>
  );
};

export default Profile;
