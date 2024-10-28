import React from 'react';
import '../App.css'; 
const Login = () => {
  return (
    <div className="login-wrapper">
      <img 
        src="URL_DA_IMAGEM_AQUI" 
        alt="Logo" 
        className="login-logo" 
      />
      <div className="login-container">
       
        <div className="form-group">
          <label>Username</label>
          <input type="text" placeholder="Enter your username" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="Enter your password" />
        </div>
        <button className="login-button">Login</button>
        <div className="forgot-password">
          <a href="#">Forgot your password?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
