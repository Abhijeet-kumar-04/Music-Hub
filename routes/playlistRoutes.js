const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');

// Create playlist
router.post('/', playlistController.create);

// Get playlist by ID
router.get('/:id', playlistController.getById);

// Update playlist
router.put('/:id', playlistController.update);

// Delete playlist
router.delete('/:id', playlistController.delete);

// Shuffle playlist
router.post('/:id/shuffle', playlistController.shuffle);

module.exports = router;