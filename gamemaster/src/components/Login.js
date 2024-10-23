import React, { useState } from "react";

import "../App.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    alert("A funcionalidade de login será implementada aqui!");
  };

  return (
    <div id="LoginBody">
      <div className="main-login">
        <div className="left-login"></div>
        <div className="right-login">
          <form className="card-login" onSubmit={handleSubmit}>
            <h1>Welcome back!</h1>
            <div className="textfield-login">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Username"
                maxLength="15"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="textfield-login">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-login" type="submit">
              Login
            </button>
            <div className="reference_login">
              <p>If you don't have an account,</p>
              <a href="/register" style={{ cursor: "pointer" }}>
                register.
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;