const Playlist = require('../models/playlist');

// Create playlist
exports.create = async (req, res) => {
  try {
    const { name, description, songs, createdBy } = req.body;
    const playlist = new Playlist({ name, description, songs, createdBy });
    await playlist.save();
    res.status(201).json({ message: 'Playlist created successfully', playlist });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get playlist by ID
exports.getById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('songs');
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update playlist
exports.update = async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist updated', playlist });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete playlist
exports.delete = async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Shuffle playlist (dummy implementation)
exports.shuffle = async (req, res) => {
  try {
    res.json({ message: 'Playlist shuffled (not implemented)' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
