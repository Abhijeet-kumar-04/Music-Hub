const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true }, // Artist name as string
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }, // Optional reference if it's a local artist
  album: { type: String, default: 'Single' },
  audioUrl: { type: String }, // Path to local mp3 file, empty for Spotify tracks
  coverUrl: { type: String }, // Cover image path or URL
  spotifyId: { type: String, unique: true, sparse: true }, // For Spotify catalog tracks
  isLocal: { type: Boolean, default: true },
  duration: { type: Number, default: 180 }, // in seconds
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of User ObjectIds who liked the track
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Song || mongoose.model('Song', songSchema);
