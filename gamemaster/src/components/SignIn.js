import React, { useState } from 'react';
import '../App.css'; 

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password, confirmPassword, country });
  };

  return (
    <div className="signin-wrapper">
      <img 
          src="URL_DA_IMAGEM_AQUI"
          alt="Logo"
          className="signin-logo"
      />
      <div className="signin-container">
        <form onSubmit={handleSubmit}>
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
              {}
            </select>
          </div>
          <button type="submit" className="signin-button">Sign in</button>
          <div className="signin-footer">
            <p><a href="/password-reset">Forgot password?</a></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;