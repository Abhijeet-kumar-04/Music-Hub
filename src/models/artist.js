const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String },
  role: { type: String, default: 'artist' },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  monthlyListeners: { type: Number, default: 0 }
});

module.exports = mongoose.models.Artist || mongoose.model('Artist', artistSchema);
