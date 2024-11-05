import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; 
import profilePicPlaceholder from "../Images/1547006.jpg"; 

const Header = () => {
  return (
    <header className="header">
      <nav className="navbar">
        <div className="logo">
          <Link to="/">Home</Link> 
        </div>
        <div className="profile-container">
          <img src={profilePicPlaceholder} alt="Profile" className="profile-pic" />
        </div>
      </nav>
    </header>
  );
};

export default Header;
