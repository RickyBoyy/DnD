const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

exports.register = async (req, res) => {
  const { email, password, country } = req.body;

  if (!email || !password || !country) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (email, password, country) VALUES (?, ?, ?)",
      [email, hashedPassword, country]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during user registration:", error); // Log the error
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "Email already in use" });
    } else {
      res.status(500).json({ message: "Error registering user", error });
    }
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Fetch the user
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the username is set
    const hasUsername = user.username ? true : false;

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      email: user.email,
      username: user.username, // Will be null if not set
      hasUsername,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};


// In your authController.js or appropriate controller
exports.setUsername = async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ message: "Email and username are required" });
  }

  try {
    // Update the user's username in the database
    const [result] = await pool.execute(
      "UPDATE users SET username = ? WHERE email = ?",
      [username, email]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Failed to update username" });
    }

    res.status(200).json({ message: "Username set successfully" });
  } catch (error) {
    console.error("Error setting username:", error);
    res.status(500).json({ message: "Error setting username", error });
  }
};



// Get profile (user info)
exports.getProfile = async (req, res) => {
  const userId = req.user.id; // Extracted from JWT via the authenticate middleware

  try {
    // Query the database to get the user's information
    const [rows] = await pool.execute("SELECT username, email FROM users WHERE id = ?", [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    res.status(200).json({
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error });
  }
};





