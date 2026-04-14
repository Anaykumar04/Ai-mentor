const express = require('express');
const router = express.Router();
const { analyzeCode, runCode, saveProgress, getProgress } = require('../controllers/codeController');
const { register, login, getLeaderboard } = require('../controllers/authController');

router.post('/analyze-code', analyzeCode);
router.post('/run-code', runCode);
router.post('/save-progress', saveProgress);
router.get('/progress', getProgress);

// Auth & Gamification Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
