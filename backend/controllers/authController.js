const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Protection: Ensure only one 'admin' identity can ever exist
    if (username.toLowerCase() === 'admin') {
      const adminExists = await User.findOne({ username: 'admin' });
      if (adminExists) {
        return res.status(403).json({ error: 'System Protected: Administrative Authority already established.' });
      }
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username, points: user.points } });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, points: user.points } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 }).limit(10).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
