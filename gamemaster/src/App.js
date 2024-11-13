import React, { useEffect } from "react";
import socket from "./socket";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import LoginPage from "./pages/LoginPage";
import HostOrPlayerPage from "./pages/HostOrPlayerPage";
import Header from "./components/Header";
import GamePage from "./pages/GamePage";
import CreateCharacterPage from "./pages/CreateCharacterPage";
import LobbyPage from "./pages/LobbyPage";

function App() {
  useEffect(() => {
    // Connect the socket when App mounts
    socket.connect();

    // Disconnect on unmount to prevent multiple connections on reload
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/hostorplayer" element={<HostOrPlayerPage />} />
          <Route path="/lobby/:gameCode" element={<LobbyPage />} />
          <Route path="/createcharacter" element={<CreateCharacterPage />} />
          <Route path="/" element={<GamePage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
