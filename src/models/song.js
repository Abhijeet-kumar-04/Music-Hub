const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
  album: { type: String, default: 'Single' },
  audioUrl: { type: String },
  coverUrl: { type: String },
  spotifyId: { type: String, unique: true, sparse: true },
  isLocal: { type: Boolean, default: true },
  duration: { type: Number, default: 180 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Song || mongoose.model('Song', songSchema);
