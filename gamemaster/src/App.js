import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignInPage from "./pages/SignInPage"; 
import LoginPage from "./pages/LoginPage";

 

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/SignIn" element={<SignInPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
