import React, { useEffect } from "react";
import socket from "./socket";
import "./App.css";
import {BrowserRouter as Router,Route,Routes,useLocation,} from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import LoginPage from "./pages/LoginPage";
import HostOrPlayerPage from "./pages/HostOrPlayerPage";
import Header from "./components/Header";
import GamePage from "./pages/GamePage";
import CreateCharacterPage from "./pages/CreateCharacterPage";
import LobbyPage from "./pages/LobbyPage";
 
import ProfilePage from "./pages/ProfilePage";
import SetUsernamePage from "./pages/SetUsernamePage";

import CharactersPage from "./pages/CharactersPage";

function App() {
  useEffect(() => {
    socket.connect();

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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/set-username" element={<SetUsernamePage />} />
          <Route path="/lobby/:gameCode" element={<LobbyPage />} />
          <Route path="/createcharacter" element={<CreateCharacterPage />} />
          <Route path="/" element={<GamePage />} />
        </Routes>

        <Layout />
      </Router>
    </div>
  );
}

const Layout = () => {
  const location = useLocation();

  
  const pagesWithoutHeader = ["/", "/signin", "/login", "/game","/profile","/set-username"];

 
  const currentPath = location.pathname.trim().toLowerCase();
  const showHeader = !pagesWithoutHeader.includes(currentPath);

  return (
    <>
      
      {showHeader && <Header />}
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hostorplayer" element={<HostOrPlayerPage />} />
        <Route path="/lobby/:gameCode" element={<LobbyPage />} />
        <Route path="/createcharacter" element={<CreateCharacterPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/" element={<CharactersPage />} />
      </Routes>
    </>
  );
};



export default App;
