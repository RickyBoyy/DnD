import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";
import logoImage from "../assets/logo.png";
import apiClient from "../utils/apiClient";
import { getSocket } from "../socket";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

 

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await apiClient.post("/login", { email, password });
  
      // Save token to sessionStorage
      const token = response.data.token;
      sessionStorage.setItem("token", token);
      console.log("Token saved to sessionStorage:", token);
  
      // Initialize/reconnect the socket with the new token
      const socket = getSocket();
      socket.connect();
  
      alert("Login successful!");
      setError(null);
  
      // Navigate based on user status
      if (!response.data.hasUsername) {
        navigate("/set-username", { state: { email } });
      } else {
        navigate("/profile"); // Directly navigate to the profile page here
      }
    } catch (error) {
      console.error("Error during login:", error);
  
      // Handle specific errors (e.g., invalid credentials)
      setError(
        error.response?.data?.message || "Invalid email or password. Please try again."
      );
    }
  };
  

  

  return (
    <div className="login-wrapper">
      <div className="animation-container"></div>

      <div className="login-container">
        <div className="logo-container">
          <img src={logoImage} alt="Logo" className="login-logo" />
        </div>

        <div className="card-login">
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
            <button className="btn-login" type="submit">
              Login
            </button>
            {error && <div className="error-message">{error}</div>}
          </form>
          <p className="register-link">
            Don’t have an account? <Link to="/signin">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
