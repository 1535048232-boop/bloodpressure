const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;