import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';
import logoImage from "../assets/logo.png";


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/login', { 
        email, 
        password 
      });
      alert("Login successful!");
      console.log("Login successful", response.data);
      setError(null);
    } catch (error) {
      console.error("Error during login:", error);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-wrapper">
      <img src={logoImage} alt="Logo" className="login-logo"  />
      <div className="login-container">
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button className="login-button" type="submit">Login</button>
          {error && <div className="error-message">{error}</div>}
          <div className="forgot-password">
            <a href="#">Forgot your password?</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
