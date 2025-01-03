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
