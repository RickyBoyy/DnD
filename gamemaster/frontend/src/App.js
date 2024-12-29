import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import getSocket from "./socket"; // Use getSocket instead of socket directly
import LoginPage from "./pages/LoginPage";
import SignInPage from "./pages/SignInPage";
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
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hostorplayer" element={<HostOrPlayerPage />} />
        <Route path="/lobby/:gameCode" element={<LobbyPage />} />
        <Route path="/createcharacter" element={<CreateCharacterPage />} />
        <Route path="/game/:gameCode" element={<GamePage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/set-username" element={<SetUsernamePage />} />
      </Routes>
    </>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const authRequiredPaths = ["/hostorplayer", "/lobby", "/createcharacter"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token retrieved from localStorage:", token);

    if (authRequiredPaths.some((path) => location.pathname.startsWith(path))) {
      if (token) {
        setIsAuthenticated(true);
        const socket = getSocket(); // Use getSocket() here
        if (!socket.connected) {
          console.log("Connecting socket...");
          socket.connect();
        } // Connect to socket if token is valid
      } else {
        console.error("No token available. Redirecting to login.");
        navigate("/login");
      }
    }

    return () => {
      const socket = getSocket();
      if (isAuthenticated && socket.connected) {
        console.log("Disconnecting socket on unmount.");
        socket.disconnect();
      }
    };
  }, [location.pathname, navigate]);

  return <Layout />;
};

const Root = () => (
  <Router>
    <App />
  </Router>
);

export default Root;
