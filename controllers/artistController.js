const Artist = require('../models/artist');

// Register new artist
exports.register = async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;
    const artist = new Artist({ name, email, password, bio });
    await artist.save();
    res.status(201).json({ message: 'Artist registered successfully', artist });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get artist profile
exports.getProfile = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).populate('songs');
    if (!artist) return res.status(404).json({ error: 'Artist not found' });
    res.json(artist);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};