import React, { useEffect, useState } from "react";
import axios from "axios";
import '../App.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("http://localhost:3000/profile", {
          headers: {
            Authorization: `Bearer ${token}`, // Send token in Authorization header
          },
        });

        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile", error);
        setError("Error fetching profile");
      }
    };

    fetchUserData();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Adventurer's Profile</h1>
      <div className="decorative-flair">Heroic Stats</div>
      <p>Username: {profile.username}</p>
      <p>Email: {profile.email}</p>
      <div className="decorative-flair">Quest Log</div>
    </div>
  );
  
  
};

export default Profile;
