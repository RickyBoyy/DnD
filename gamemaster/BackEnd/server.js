require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const authController = require('./authController');

const app = express();

// Configure CORS to allow requests from http://localhost:3001
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// API routes
app.post('/register', authController.register);
app.post('/login', authController.login);

// Fallback route to serve React app for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
