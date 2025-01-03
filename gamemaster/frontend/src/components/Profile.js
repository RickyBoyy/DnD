import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [characters, setCharacters] = useState([]); // State for user characters
  const [error, setError] = useState(null);
  const [avatar, setAvatar] = useState(null); // State for avatar file
  const [preview, setPreview] = useState(null); // Avatar preview before upload
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);

    // Optionally display a preview of the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result); // preview state to hold base64 string
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatar) return;

    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("avatar", avatar);

      console.log("Uploading avatar:", avatar);
      const response = await axios.post(
        "http://localhost:5000/uploadAvatar",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfile((prevProfile) => ({
        ...prevProfile,
        avatar_url: response.data.avatar_url,
      }));
      alert("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar.");
    }
  };

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
          {profile.avatar_url && (
            <img
              src={`http://localhost:5000${profile.avatar_url}`}
              alt="Avatar"
              style={{ width: "100px", height: "100px", borderRadius: "50%" }}
            />
          )}
          <p>
            <span className="info-label">Username:</span> {profile.username}
          </p>
          <p>
            <span className="info-label">Email:</span> {profile.email}
          </p>
          <input type="file" onChange={handleAvatarChange} />
          <button onClick={handleAvatarUpload}>Upload Avatar</button>
        </div>
        <div className="decorative-flair">Quest Log</div>
        <div className="no-quests-message">
          <p>You have not embarked on any quests yet. Start your journey now!</p>
        </div>
      </div>


      {/* Buttons */}
      <div className="buttons-container">
        <button
          className="play-button"
          onClick={handlePlayButtonClick}
          disabled={characters.length === 0} // Disable if no characters
        >
          Play
        </button>
        <button className="character-button" onClick={handleNavigateCharacter}>
          Your Characters
        </button>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>


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
