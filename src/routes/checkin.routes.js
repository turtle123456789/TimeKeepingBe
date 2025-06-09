const express = require('express');
const router = express.Router();
const { getCheckinHistory, getAllCheckinsToday } = require('../controllers/checkin.controller');

// Get check-in history for a month
router.get('/history', getCheckinHistory);

// Get all check-ins for today
router.get('/today', getAllCheckinsToday);

module.exports = router; 