import React from 'react';
import '../App.css'; 
import profilePicPlaceholder from "../assets/1547006.jpg"; 
import logoImage from "../assets/logo.png"; 

const Header = () => {
  return (
    <header className="header">
      <nav className="navbar">
        <div className="logo">
            <img src={logoImage} alt="Logo" className="logo-img" /> 
        </div>
        <div className="profile-container">
          <img src={profilePicPlaceholder} alt="Profile" className="profile-pic" />
        </div>
      </nav>
    </header>
  );
};

export default Header;

