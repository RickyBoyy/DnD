import React from "react";

import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import LoginPage from "./pages/LoginPage";
import HostOrPlayerPage from "./pages/HostOrPlayer";
import Header from "./components/Header";
import CreateCharacter from "./components/CreateCharacter";
import CreateCharacterPage from "./pages/CreateCharacterPage";
import LobbyPage from "./pages/LobbyPage";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/hostorplayer" element={<HostOrPlayerPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/" element={<CreateCharacterPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
