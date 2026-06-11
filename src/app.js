const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const MongoStore = require('connect-mongo');

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
app.set('trust proxy', 1); // For deployment proxies

// --- Middleware ---
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to allow external images/scripts (JioSaavn/Spotify)
}));
app.use(compression());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Configuration ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key-that-is-hard-to-guess',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/music_full' 
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 
  } // 1 day
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
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth attempts per windowMs
  message: "Too many authentication attempts, please try again later."
});

app.use('/artists', artistRoutes);
app.use('/users', userRoutes);
app.use('/playlists', playlistRoutes);
app.use('/', authLimiter, authRoutes);
app.use('/', musicRoutes);

module.exports = app;
