require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const authController = require("./authController");
const { authenticate } = require("./middleware/authenticate");

const app = express();

app.use(
  cors({
    origin:"*", // Use environment variable or wildcard
    methods: ["GET", "POST"],
    credentials: true,
  })
);


app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Auth routes
app.post("/register", authController.register);
app.post("/login", authController.login);
app.post("/set-username", authController.setUsername);
app.get("/profile", authenticate, authController.getProfile);
app.post("/createCharacter", authenticate, authController.createCharacter);
app.get("/getCharacters", authenticate, authController.getCharacters);
app.post("/refresh-token",authController.refreshToken);
app.post("/uploadAvatar", authenticate, authController.uploadAvatar);




// Serve static files for frontend (if applicable)
//app.use(express.static(path.join(__dirname, "build")));
//app.get("*", (req, res) => {
  //res.sendFile(path.join(__dirname, "build", "index.html"));
//});

const PORT = process.env.AUTH_PORT || 3001;
app.listen(PORT, () =>
  console.log(`Auth Server running on http://localhost:${PORT}`)
);
