import React, { useState } from "react";
import axios from "axios";
import "../App.css";
import logoImage from "../assets/logo.png";
import { useNavigate, Link } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return `Password must be at least ${minLength} characters long.`;
    }
    if (!hasNumber && !hasSpecialChar) {
      return "Password must contain at least one number or one special character.";
    }

    return null;
  };

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!country) {
      setError("Please select a country");
      return;
    }

    try {
      // Get API URL from environment variable
      const apiUrl = "http://localhost:5000"; // Default fallback if the env variable is not set

      // Use the environment variable for the API URL
      const response = await axios.post("http://localhost:5000/register", {
        email,
        password,
        country,
      });
      

      setError(null);
      alert("Registration successful!");
      navigate("/login");
    } catch (err) {
      setError("Error registering user. Please try again.");
    }
  };

  return (
    <div className="signin-wrapper">
      {/* Lado Esquerdo */}
      <div className="animation-container">
        
      </div>

      {/* Lado Direito */}
      <div className="signin-container">
        <form onSubmit={handleSignUp} className="card-signin">
          <img src={logoImage} alt="Logo" className="signin-logo" />
          
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && <div className="error">{passwordError}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
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
          <button type="submit" className="signin-button">
            Sign Up
          </button>
          <p className="login-link">
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;