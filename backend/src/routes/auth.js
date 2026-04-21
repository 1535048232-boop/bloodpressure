const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelpers } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, birthDate, gender } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await dbHelpers.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email || '']
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await dbHelpers.run(
      'INSERT INTO users (username, email, password_hash, full_name, birth_date, gender) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email || null, passwordHash, fullName || null, birthDate || null, gender || null]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.lastID, username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.lastID,
        username,
        email: email || null,
        fullName: fullName || null
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Get user from database
    const user = await dbHelpers.get(
      'SELECT id, username, email, password_hash, full_name FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbHelpers.get(
      'SELECT id, username, email, full_name, birth_date, gender, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, fullName, birthDate, gender } = req.body;

    await dbHelpers.run(
      'UPDATE users SET email = ?, full_name = ?, birth_date = ?, gender = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [email || null, fullName || null, birthDate || null, gender || null, req.user.id]
    );

    const updatedUser = await dbHelpers.get(
      'SELECT id, username, email, full_name, birth_date, gender FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;