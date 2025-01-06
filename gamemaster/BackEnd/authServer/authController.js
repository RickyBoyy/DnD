const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Configuração do pool de conexão MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


const storage = multer.diskStorage({
  
  destination: (req, file, cb) => {
    console.log("Saving file to:", path.resolve("uploads/"));
    cb(null, "uploads"); // Directory where avatars will be stored
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed (jpeg, jpg, png)"));
    }
  },
}).single("avatar");



exports.uploadAvatar = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    console.log("Uploaded file details:", req.file);
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token is required" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;


      // Update avatar URL in the database
      const [result] = await pool.execute(
        "UPDATE users SET avatar_url = ? WHERE id = ?",
        [avatarUrl, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "Avatar uploaded successfully", avatar_url: avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
};

// Registro de usuário
exports.register = async (req, res) => {
  const { email, password, country } = req.body;

  if (!email || !password || !country) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      "INSERT INTO users (email, password, country) VALUES (?, ?, ?)",
      [email, hashedPassword, country]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during user registration:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "Email already in use" });
    } else {
      res.status(500).json({ message: "Error registering user" });
    }
  }
};

// Login de usuário
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const hasUsername = user.username ? true : false;
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      email: user.email,
      username: user.username,
      hasUsername,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};



// Atualizar username
exports.setUsername = async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ message: "Email and username are required" });
  }

  try {
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
    res.status(500).json({ message: "Error setting username" });
  }
};

// Criar personagem
exports.createCharacter = async (req, res) => {
  const {
    name,
    race,
    class_cr,
    alignment,
    strength,
    dexterity,
    constitution,
    intelligence,
    wisdom,
    charisma,
    ch_background,
  } = req.body;

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [existingCharacter] = await pool.execute(
      "SELECT * FROM character_player WHERE character_name = ? AND character_user_id = ?",
      [name, userId]
    );

    if (existingCharacter.length > 0) {
      return res.status(400).json({ message: "Character name already exists for this user" });
    }

    await pool.execute(
      `INSERT INTO character_player 
      (character_name, character_race, character_class, character_alignment, character_strength, character_dexterity, 
      character_constitution, character_intelligence, character_wisdom, character_charisma, 
      character_background, character_user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        race,
        class_cr,
        alignment,
        strength,
        dexterity,
        constitution,
        intelligence,
        wisdom,
        charisma,
        ch_background,
        userId,
      ]
    );

    res.status(201).json({ message: "Character created successfully" });
  } catch (error) {
    console.error("Error creating character:", error);
    res.status(500).json({ message: "Error creating character" });
  }
};

// Obter personagens
exports.getCharacters = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [characters] = await pool.execute(
      "SELECT * FROM character_player WHERE character_user_id = ?",
      [userId]
    );

    res.status(200).json({ characters });
  } catch (error) {
    console.error("Error fetching characters:", error);
    res.status(500).json({ message: "Error fetching characters" });
  }
};

// Obter perfil do usuário
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.execute(
      "SELECT username, email, avatar_url FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    res.status(200).json({
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Refresh Token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id, username: decoded.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Invalid refresh token:", error.message);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};
