import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';
import logoImage from "../assets/logo.png"; 


const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
  
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:3000/register', { 
        email, password, country 
      });
  
      setError(null);
      alert("Registration successful!");
    } catch (err) {
      setError("Error registering user. Please try again.");
    }
  };
  

  return (
    <div className="signin-wrapper">
      <img src={logoImage} alt="Logo" className="signin-logo" /> 
      <div className="signin-container">
        <form onSubmit={handleSignUp}>
          <div className="form-group">
            <label>Email address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <select 
              value={country} 
              onChange={(e) => setCountry(e.target.value)} 
              required 
            >
              <option value="" disabled>Select your country</option>
              <option value="BR">Brazil</option>
              <option value="US">United States</option>
              <option value="PT">Portugal</option>
              <option value="ES">Spain</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
            </select>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="signin-button">Sign in</button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
