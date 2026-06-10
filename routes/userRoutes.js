const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User signup
router.post('/signup', userController.register);

// Get user profile
router.get('/:id', userController.getProfile);
router.post('/login', userController.login);

module.exports = router;