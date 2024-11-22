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
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};

exports.createCharacter = async (req, res) => {
  const {
    name,
    race,
    class_cr,
    alignment,
    strenght,
    dexterity,
    constituition,
    intelligence,
    wisdom,
    charisma,
    ch_background,
  } = req.body;

  // Extract the token from the Authorization header
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    // Verify and decode the token to get the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [result] = await pool.execute(
      `INSERT INTO character_player 
      (character_name, character_race, character_class, character_alignment, character_strength, character_dexterity, 
      character_constituition, character_intelligence, character_wisdom, character_charisma, 
      character_background, character_user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        race,
        class_cr,
        alignment,
        strenght,
        dexterity,
        constituition,
        intelligence,
        wisdom,
        charisma,
        ch_background,
        userId, 
      ]
    );

    res.status(201).json({ message: "Character created successfully", characterId: result.insertId });
  } catch (error) {
    console.error("Error during character creation:", error);

    if (error.name === "JsonWebTokenError") {
      res.status(401).json({ message: "Invalid token" });
    } else {
      res.status(500).json({ message: "Error creating character", error });
    }
  }
};


