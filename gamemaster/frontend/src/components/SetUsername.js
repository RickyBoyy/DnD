import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const SetUsername = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { email } = location.state || {};

  useEffect(() => {
    if (!email) {
      // Redirect to login page if no email is found in location state
      navigate('/login');
    }
  }, [email, navigate]);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/set-username', {
        email,
        username,
      });

      console.log('Username set successfully:', response.data);
      setLoading(false);
      // After setting the username, redirect to the profile page
      navigate('/profile');
    } catch (error) {
      console.error('Error setting username:', error);
      setLoading(false);
      setError('Failed to set username. Please try again.');
    }
  };

  return (
    <div className="setusername-wrapper">
      <div className="setusername-container">
        <h2>Set Your Username</h2>
        <form className="setusername-form" onSubmit={handleUsernameSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Choose your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <button className="setusername-button" type="submit" disabled={loading}>
            {loading ? 'Setting Username...' : 'Set Username'}
          </button>
          {error && <div className="setusername-error">{error}</div>}
        </form>
      </div>
    </div>
  );
  
};

export default SetUsername;
