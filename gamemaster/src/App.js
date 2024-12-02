import React, { useEffect } from "react";
import socket from "./socket";
import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

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

const Layout = () => {
  const location = useLocation();

  const pagesWithoutHeader = [
    "/",
    "/signin",
    "/login",
    "/game",
    "/profile",
    "/set-username",
  ];

  const currentPath = location.pathname.trim().toLowerCase();
  const showHeader = !pagesWithoutHeader.includes(currentPath);

  return (
    <>
      {/* Conditionally render the Header */}
      {showHeader && <Header />}
      {/* Define all the routes */}
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hostorplayer" element={<HostOrPlayerPage />} />
        <Route path="/lobby/:gameCode" element={<LobbyPage />} />
        <Route path="/createcharacter" element={<CreateCharacterPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/set-username" element={<SetUsernamePage />} />
      </Routes>
    </>
  );
};

const App = () => {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <Layout />
    </Router>
  );
};

export default App;
