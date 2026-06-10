const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const Playlist = require('./models/playlist');
const User = require('./models/user');

// Routes
const artistRoutes = require('./routes/artistRoutes');
const userRoutes = require('./routes/userRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const authRoutes = require('./routes/authRoutes');
const musicRoutes = require('./routes/musicRoutes');

const app = express();

// --- View Engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// --- Middleware ---
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Configuration ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key-that-is-hard-to-guess',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// --- Global Layout Middleware ---
app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.userPlaylists = [];
  res.locals.allPlaylists = [];
  
  try {
    if (mongoose.connection.readyState === 1) {
      res.locals.allPlaylists = await Playlist.find({ name: { $ne: 'Liked Songs' } })
        .populate('createdBy')
        .limit(10) || [];

      if (req.session && req.session.isLoggedIn && req.session.role === 'user') {
        const user = await User.findById(req.session.accountId).populate('playlists');
        if (user) {
          res.locals.userPlaylists = user.playlists || [];
        }
      }
    }
  } catch (err) {
    console.error('Error in global layout middleware:', err);
  }
  next();
});

// --- Spotify Mock API Setup ---
const spotifyApi = require('./config/spotify');

async function retrieveToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Spotify mock token refreshed');
  } catch (err) {
    console.error('Error retrieving Spotify token:', err.message || err);
  }
}

(async () => {
  try {
    await retrieveToken();
  } catch (err) {
    console.error('Initial mock token retrieval failed:', err);
  }

  setInterval(async () => {
    try {
      await retrieveToken();
    } catch (err) {
      console.error('Mock token refresh failed:', err);
    }
  }, 1000 * 60 * 60); // Refresh every hour
})();

// --- Mount Routers ---
app.use('/artists', artistRoutes);
app.use('/users', userRoutes);
app.use('/playlists', playlistRoutes);
app.use('/', authRoutes);
app.use('/', musicRoutes);

module.exports = app;
