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
    return <div>{error}</div>;
  }

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h1 className="dnd-title">Adventurer's Profile</h1>
      <div className="decorative-flair">Heroic Stats</div>
      <p>Username: {profile.username}</p>
      <p>Email: {profile.email}</p>
      <div className="decorative-flair">Quest Log</div>

      {/* Floating Play Button */}
      <button className="play-button" onClick={handlePlayButtonClick}>
        Play
      </button>

      {/* Navigate Home Button */}
      <button className="character-button" onClick={handleNavigateCharacter}>
        Your Characters
      </button>
    </div>
  );
};

export default Profile;
