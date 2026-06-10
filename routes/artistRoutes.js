const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');

// Artist signup
router.post('/signup', artistController.register);

// Get artist profile
router.get('/:id', artistController.getProfile);

module.exports = router;