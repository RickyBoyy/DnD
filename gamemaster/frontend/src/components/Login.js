import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";
import logoImage from "../assets/logo.png"; // Logo fora do card

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await axios.post(`${apiUrl}/login`, { email, password });

      // Save the token to localStorage
      localStorage.setItem("token", response.data.token);

      alert("Login successful!");
      setError(null);

      // Check if the user has a username
      if (!response.data.hasUsername) {
        navigate("/set-username", { state: { email } });
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="animation-container">
       
      </div>

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
            Don’t have an account?{" "}
            <Link to="/signin">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
