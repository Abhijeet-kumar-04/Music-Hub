const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const saavnApi = require('./utils/saavnApi');
const axios = require('axios');
const { getDiverseTracks } = require('./utils/shuffle');

// Models
const User = require('./models/User');
const Artist = require('./models/Artist');
const Song = require('./models/song');
const Playlist = require('./models/playlist');

// Routes
const artistRoutes = require('./routes/artistRoutes');
const userRoutes = require('./routes/userRoutes');
const playlistRoutes = require('./routes/playlistRoutes');

const app = express();

// --- Multer Configuration for Song Uploads ---
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.mp3')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files (.mp3) are allowed!'), false);
      }
    } else if (file.fieldname === 'cover') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// --- Database Connection ---
mongoose.connect('mongodb://localhost:27017/music_full')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- View Engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Session Configuration ---
app.use(session({
  secret: 'a-very-strong-secret-key-that-is-hard-to-guess', // Change this to a random string
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.userPlaylists = [];
  res.locals.allPlaylists = [];
  
  try {
    if (mongoose.connection.readyState === 1) {
      // Fetch public system-wide playlists, limit to 10
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
const SpotifyWebApiMock = require('./utils/spotifyMock');
const spotifyApi = new SpotifyWebApiMock({
  clientId: 'mock_client_id',
  clientSecret: 'mock_client_secret'
});

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

// --- Auth Middleware ---
async function isAuthenticated(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    if (req.session.role === 'user') {
      try {
        let user = await User.findById(req.session.accountId).populate('playlists');
        if (user) {
          let likedSongsPlaylist = user.playlists.find(p => p.name === 'Liked Songs');
          if (!likedSongsPlaylist) {
            likedSongsPlaylist = new Playlist({
              name: 'Liked Songs',
              description: 'Your favorite songs',
              createdBy: user._id,
              songs: []
            });
            await likedSongsPlaylist.save();
            user.playlists.push(likedSongsPlaylist._id);
            await user.save();
          }
        }
      } catch (err) {
        console.error('Error ensuring Liked Songs playlist:', err);
      }
    }
    return next();
  }
  res.redirect('/login');
}

// --- Routes ---


app.get('/login', (req, res) => {
  res.render('login');
});

// Home/Login Page
app.get('/', (req, res) => {
  res.render('login');
});

// Login Handler (User/Artist)
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).send('Please provide email, password, and role.');
  }
  try {
    let account = null;
    if (role === 'user') {
      account = await User.findOne({ email });
    } else if (role === 'artist') {
      account = await Artist.findOne({ email });
    }
    if (!account) {
      return res.status(404).send('No account found with that email address.');
    }
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).send('Invalid password.');
    }
    req.session.accountId = account._id;
    req.session.role = role;
    req.session.isLoggedIn = true;
    const safeName = encodeURIComponent(account.name);
    res.redirect(`/${role}/${safeName}/dashboard`);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).send('An error occurred during login. Please try again.');
  }
});

// Signup Handler (User/Artist)
app.post('/signup', async (req, res) => {
  const { name, email, password, role, bio } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).send('Please fill out all required fields.');
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let newAccount = null;
    if (role === 'user') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).send('A user with this email already exists.');
      }
      newAccount = new User({ name, email, password: hashedPassword });
      await newAccount.save();
    } else if (role === 'artist') {
      const existingArtist = await Artist.findOne({ email });
      if (existingArtist) {
        return res.status(409).send('An artist with this email already exists.');
      }
      newAccount = new Artist({ name, email, password: hashedPassword, bio: bio || '' });
      await newAccount.save();
    }
    if (newAccount) {
      req.session.accountId = newAccount._id;
      req.session.role = role;
      req.session.isLoggedIn = true;
      const safeName = encodeURIComponent(newAccount.name);
      return res.redirect(`/${role}/${safeName}/dashboard`);
    }
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).send('An error occurred during signup. Please try again.');
  }
});

// Dashboard Route (Protected)
app.get('/:role/:name/dashboard', isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId)
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    let categories = [];
    try {
      const spotifyData = await spotifyApi.getCategories({
        limit: 20,
        country: 'IN'
      });
      categories = spotifyData.body.categories.items;
    } catch (spotifyError) {
      console.error('Failed to fetch categories:', spotifyError);
    }

    // Overhaul Additions: Fetch hits, recommendations, and leaderboard
    let trendingHits = [];
    try {
      const hits = await saavnApi.searchSongs("trending hindi", 1, 30);
      trendingHits = getDiverseTracks(hits, 6);
    } catch (err) {
      console.error("Trending hits fetch failed:", err);
    }

    let recommendedSongs = [];
    try {
      const recs = await saavnApi.searchSongs("latest english songs", 1, 30);
      recommendedSongs = getDiverseTracks(recs, 6);
    } catch (err) {
      console.error("Recommended fetch failed:", err);
    }

    let topArtists = [];
    try {
      const allArtists = await Artist.find().populate('songs').limit(10);
      topArtists = allArtists.map(art => {
        const followerCount = art.followers ? art.followers.length : 0;
        const songLikesCount = art.songs ? art.songs.reduce((acc, song) => acc + (song.likes ? song.likes.length : 0), 0) : 0;
        const listeners = (followerCount * 15) + (songLikesCount * 4) + 120;
        return {
          _id: art._id,
          name: art.name,
          bio: art.bio,
          followersCount: followerCount,
          monthlyListeners: listeners,
          songCount: art.songs ? art.songs.length : 0
        };
      }).sort((a, b) => b.monthlyListeners - a.monthlyListeners);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
    }

    res.render('dashboard', {
      account: loggedInUser,
      items: categories,
      trendingHits: trendingHits,
      recommendedSongs: recommendedSongs,
      topArtists: topArtists
    });

  } catch (error) {
    console.error('Error in dashboard route:', error);
    res.status(500).send('An error occurred while loading the dashboard. Please check the server logs.');
  }
});

// Category Playlists Route
app.get('/category/:id', isAuthenticated, async (req, res) => {
  const categoryId = req.params.id;

  try {
    // Fetch the logged-in user's details for the header
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId)
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    // First, we still need the category's name
    const categoryInfo = await spotifyApi.getCategory(categoryId);
    const categoryName = categoryInfo.body.name;
    
    // --- THIS IS THE FIX ---
    // Instead of getPlaylistsForCategory, we will SEARCH for playlists
    const playlistData = await spotifyApi.searchPlaylists(categoryName, {
      country: 'IN',
      limit: 20
    });
    // --- END OF FIX ---

    // The data structure is the same, so the rest of the code works perfectly
    const playlists = playlistData.body.playlists.items;

    res.render('category-playlists', {
      account: loggedInUser,
      playlists: playlists,
      categoryName: categoryName
    });

  } catch (error) {
    console.error("Error in category route:", error);
    res.status(500).send("An error occurred while loading this category.");
  }
});

// New Releases Route
app.get('/browse/new-releases', isAuthenticated, async (req, res) => {
  try {
    // Fetch the logged-in user's details for the header
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId)
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    // Use the correct API function to get newly released albums
    const newReleasesData = await spotifyApi.getNewReleases({
      limit: 20,
      country: 'IN'
    });

    // The data we need is in newReleasesData.body.albums.items
    const albums = newReleasesData.body.albums.items;

    res.render('new-releases', {
      account: loggedInUser,
      albums: albums
    });

  } catch (error) {
    console.error("Error fetching new releases:", error);
    res.status(500).send("Could not fetch new releases.");
  }
});

// Create Playlist GET
app.get('/playlist/create', isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId)
      : await Artist.findById(req.session.accountId);
    res.render('create-playlist', { account: loggedInUser });
  } catch (err) {
    res.status(500).send('Error loading create playlist page.');
  }
});

// Playlist Detail Route
app.get('/playlist/:id', isAuthenticated, async (req, res) => {
  const playlistId = req.params.id;

  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    let playlist;
    let isLocalPlaylist = false;

    // Check if playlistId is a valid Mongoose ObjectId
    if (mongoose.isValidObjectId(playlistId)) {
      const localPlaylist = await Playlist.findById(playlistId).populate('songs');
      if (localPlaylist) {
        isLocalPlaylist = true;
        playlist = {
          id: localPlaylist._id.toString(),
          name: localPlaylist.name,
          description: localPlaylist.description || '',
          images: [{ url: '/images/default-cover.png' }],
          tracks: {
            items: localPlaylist.songs.map(song => ({
              track: {
                id: song.spotifyId || song._id.toString(),
                name: song.title,
                artists: [{ name: song.artist }],
                album: {
                  name: song.album,
                  images: [{ url: song.coverUrl || 'https://placehold.co/300x300/3A6073/FFFFFF?text=Local' }, { url: song.coverUrl }, { url: song.coverUrl }]
                },
                duration_ms: song.duration * 1000,
                isLocal: song.isLocal,
                audioUrl: song.audioUrl
              }
            }))
          }
        };
      }
    }

    if (!playlist) {
      const playlistData = await spotifyApi.getPlaylist(playlistId);
      playlist = playlistData.body;

      if (playlist.tracks && playlist.tracks.items && playlist.tracks.items.length > 0) {
        if (!playlist.tracks.items[0].track.album) {
          const trackIds = playlist.tracks.items
            .map(item => item.track ? item.track.id : null)
            .filter(id => id);

          const tracksData = await spotifyApi.getTracks(trackIds);
          playlist.tracks.items = tracksData.body.tracks.map(track => ({ track }));
        }

        // Map preview_url to audioUrl
        playlist.tracks.items = playlist.tracks.items.map(item => {
          if (item.track) {
            item.track.audioUrl = item.track.preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
          }
          return item;
        });
      }
    }

    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];

    res.render('playlist-detail', {
      account: loggedInUser,
      playlist: playlist,
      isLocalPlaylist: isLocalPlaylist,
      userPlaylists: userPlaylists
    });

  } catch (error) {
    console.error("Error fetching playlist details:", error);
    res.status(500).send("Could not fetch this playlist.");
  }
});

// Add this new route to your index.js file

app.get('/search', isAuthenticated, async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.redirect('/');
  }

  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    // 1. Search local songs
    const localSongs = await Song.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { artist: { $regex: query, $options: 'i' } },
        { album: { $regex: query, $options: 'i' } }
      ]
    });

    // 2. Search JioSaavn tracks
    let saavnTracks = [];
    try {
      saavnTracks = await saavnApi.searchSongs(query);
    } catch (err) {
      console.error("JioSaavn search failed, using empty results:", err);
    }

    // Format local songs to look like external tracks
    const formattedLocalTracks = localSongs.map(song => ({
      id: song.spotifyId || song._id.toString(),
      name: song.title,
      artists: [{ name: song.artist }],
      album: {
        name: song.album,
        images: [
          { url: song.coverUrl || 'https://placehold.co/300x300/3A6073/FFFFFF?text=Local' },
          { url: song.coverUrl || 'https://placehold.co/300x300/3A6073/FFFFFF?text=Local' },
          { url: song.coverUrl || 'https://placehold.co/64x64/3A6073/FFFFFF?text=Local' }
        ]
      },
      duration_ms: song.duration * 1000,
      isLocal: song.isLocal,
      audioUrl: song.audioUrl
    }));

    const allTracks = [
      ...formattedLocalTracks,
      ...saavnTracks
    ];
    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];

    res.render('search-results', {
      account: loggedInUser,
      tracks: allTracks,
      query: query,
      userPlaylists: userPlaylists
    });

  } catch (error) {
    console.error("Error during search:", error);
    res.status(500).send("An error occurred during the search.");
  }
});

app.get('/test-player', isAuthenticated, async (req, res) => {
  try {
    // Hum ek popular gaana search karenge jiska preview 100% hota hai
    const searchData = await spotifyApi.searchTracks("Blinding Lights by The Weeknd");
    const track = searchData.body.tracks.items[0];

    res.render('test-player', {
      track: track // Hum is gaane ki detail test page par bhejenge
    });

  } catch (error) {
    console.error("Error in test player route:", error);
    res.status(500).send("Could not load the test player.");
  }
});

// Fetch More Playlists for Category (Pagination)
app.get('/api/category/:id/playlists', isAuthenticated, async (req, res) => {
  const categoryId = req.params.id;
  // Hum frontend se 'offset' bhejenge, jo batayega ki kitne items ko skip karna hai
  const offset = parseInt(req.query.offset) || 0;

  try {
    const categoryInfo = await spotifyApi.getCategory(categoryId);
    const categoryName = categoryInfo.body.name;
    
    const playlistData = await spotifyApi.searchPlaylists(categoryName, {
      country: 'IN',
      limit: 20, // Har baar 20 naye items fetch karein
      offset: offset // Yahan se pagination control hoga
    });

    // Sirf JSON data wapas bhejein
    res.json(playlistData.body.playlists.items);

  } catch (error) {
    console.error("Error fetching more playlists:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// ─── NEW API: Paginated Search (JSON) ───────────────────────────────────────
app.get('/api/search', isAuthenticated, async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.json([]);
  try {
    const pageNum = parseInt(page) || 1;
    // Search JioSaavn with page offset
    const saavnTracks = await saavnApi.searchSongs(q, pageNum, 20);
    // Also search local DB (page 1 only to avoid duplicates)
    let localFormatted = [];
    if (pageNum === 1) {
      const localSongs = await Song.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { artist: { $regex: q, $options: 'i' } }
        ]
      }).limit(10);
      localFormatted = localSongs.map(song => ({
        id: song._id.toString(),
        name: song.title,
        artists: [{ name: song.artist }],
        album: { name: song.album || 'Single', images: [{ url: song.coverUrl || '' }, { url: song.coverUrl || '' }, { url: song.coverUrl || '' }] },
        duration_ms: song.duration * 1000,
        isLocal: true,
        audioUrl: song.audioUrl,
        likeCount: song.likes ? song.likes.length : 0
      }));
    }
    const combined = [...localFormatted, ...saavnTracks];
    res.json(combined);
  } catch (err) {
    console.error('API search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── NEW API: Category Songs for Dashboard Pills ─────────────────────────────
app.get('/api/songs/category', isAuthenticated, async (req, res) => {
  const { category } = req.query;
  if (!category) return res.json([]);
  try {
    const tracks = await saavnApi.searchSongs(category, 1, 12);
    res.json(tracks);
  } catch (err) {
    console.error('Category songs error:', err);
    res.status(500).json({ error: 'Failed to load category' });
  }
});

// ─── NEW: Follow / Unfollow Artist ───────────────────────────────────────────
app.post('/artist/:id/follow', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).json({ error: 'Only users can follow artists.' });
  }
  try {
    const artistId = req.params.id;
    const userId = req.session.accountId;

    if (!mongoose.isValidObjectId(artistId)) {
      return res.status(400).json({ error: 'Invalid artist ID.' });
    }

    const artist = await Artist.findById(artistId);
    if (!artist) return res.status(404).json({ error: 'Artist not found.' });

    const alreadyFollowing = artist.followers && artist.followers.some(f => f.toString() === userId.toString());
    if (alreadyFollowing) {
      // Unfollow
      await Artist.findByIdAndUpdate(artistId, { $pull: { followers: userId } });
      const updated = await Artist.findById(artistId);
      const followersCount = updated.followers ? updated.followers.length : 0;
      const songLikes = updated.songs ? (await Song.find({ _id: { $in: updated.songs } })).reduce((a, s) => a + (s.likes ? s.likes.length : 0), 0) : 0;
      return res.json({ following: false, followersCount, monthlyListeners: (followersCount * 15) + (songLikes * 4) + 120 });
    } else {
      // Follow
      await Artist.findByIdAndUpdate(artistId, { $addToSet: { followers: userId } });
      const updated = await Artist.findById(artistId);
      const followersCount = updated.followers ? updated.followers.length : 0;
      const songLikes = updated.songs ? (await Song.find({ _id: { $in: updated.songs } })).reduce((a, s) => a + (s.likes ? s.likes.length : 0), 0) : 0;
      return res.json({ following: true, followersCount, monthlyListeners: (followersCount * 15) + (songLikes * 4) + 120 });
    }
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Failed to follow/unfollow.' });
  }
});



// Browse Artists Route

app.get('/browse/artists', isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId)
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    const query = req.query.q;
    let pageTitle = "Browse Artists";
    let artists = [];

    // Fetch local artists
    let localArtists = [];
    if (query) {
      localArtists = await Artist.find({ name: { $regex: query, $options: 'i' } });
    } else {
      localArtists = await Artist.find({}).limit(10);
    }

    const formattedLocalArtists = localArtists.map(art => ({
      id: art._id.toString(),
      name: art.name,
      images: [{ url: 'https://placehold.co/300x300/3A6073/FFFFFF?text=Artist' }]
    }));

    // Fetch Spotify artists
    let spotifyArtists = [];
    try {
      if (query) {
        pageTitle = `Results for "${query}"`;
        const searchData = await spotifyApi.searchArtists(query, { limit: 20, country: 'IN' });
        spotifyArtists = searchData.body.artists.items;
      } else {
        pageTitle = "Top Artists";
        const searchData = await spotifyApi.searchArtists("Top Artists India", { limit: 20, country: 'IN' });
        spotifyArtists = searchData.body.artists.items;
      }
    } catch (err) {
      console.error("Spotify artists fetch failed:", err);
    }

    artists = [...formattedLocalArtists, ...spotifyArtists];

    res.render('browse-artists', {
      account: loggedInUser,
      artists: artists,
      pageTitle: pageTitle,
      query: query || ''
    });

  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).send("Could not load artists page.");
  }
});

// Artist Detail Route
app.get('/artist/:id', isAuthenticated, async (req, res) => {
  const artistId = req.params.id;
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId)
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    let artist;
    let tracks = [];
    let albums = [];

    if (mongoose.isValidObjectId(artistId)) {
      const localArtist = await Artist.findById(artistId).populate('songs');
      if (localArtist) {
        artist = {
          id: localArtist._id.toString(),
          name: localArtist.name,
          images: [{ url: 'https://placehold.co/300x300/3A6073/FFFFFF?text=Artist' }],
          followers: { total: 0 }
        };
        tracks = localArtist.songs.map(song => ({
          id: song._id.toString(),
          name: song.title,
          album: {
            name: song.album,
            images: [
              { url: song.coverUrl || '/images/default-cover.png' },
              { url: song.coverUrl || '/images/default-cover.png' },
              { url: song.coverUrl || '/images/default-cover.png' }
            ]
          },
          isLocal: true,
          audioUrl: song.audioUrl,
          artists: [{ name: localArtist.name }],
          duration_ms: song.duration * 1000
        }));
        albums = [{
          id: 'local_album',
          name: 'Local Uploads',
          images: [{ url: '/images/default-cover.png' }],
          release_date: '2026'
        }];
      }
    }

    if (!artist) {
      const artistData = await spotifyApi.getArtist(artistId);
      artist = artistData.body;
      const topTracksData = await spotifyApi.getArtistTopTracks(artistId, 'IN');
      tracks = topTracksData.body.tracks.map(t => ({
        ...t,
        audioUrl: t.preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      }));
      const artistAlbumsData = await spotifyApi.getArtistAlbums(artistId, { limit: 10, country: 'IN' });
      albums = artistAlbumsData.body.items;
    }

    let userPlaylists = [];
    if (req.session.role === 'user') {
      const user = await User.findById(req.session.accountId).populate('playlists');
      if (user) {
        userPlaylists = user.playlists;
      }
    }

    res.render('artist-detail', {
      account: loggedInUser,
      artist: artist,
      tracks: tracks,
      albums: albums,
      userPlaylists: userPlaylists
    });

  } catch (error) {
    console.error("Error fetching artist details:", error);
    res.status(500).send("Could not load this artist's page.");
  }
});

// Fetch More Albums for Artist (Pagination)
app.get('/api/artist/:id/albums', isAuthenticated, async (req, res) => {
    const artistId = req.params.id;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const artistAlbumsData = await spotifyApi.getArtistAlbums(artistId, {
            limit: 10,
            offset: offset,
            country: 'IN'
        });
        res.json(artistAlbumsData.body.items);
    } catch (error) {
        console.error("Error fetching more albums:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
});

// --- New Local Music App Routes ---

// Upload Song GET
app.get('/songs/upload', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'artist') {
    return res.status(403).send('Only artists can upload songs.');
  }
  try {
    const artist = await Artist.findById(req.session.accountId);
    res.render('upload-song', { account: artist });
  } catch (err) {
    res.status(500).send('Error loading upload page.');
  }
});

// Upload Song POST
app.post('/songs/upload', isAuthenticated, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  if (req.session.role !== 'artist') {
    return res.status(403).send('Only artists can upload songs.');
  }
  try {
    const { title, album } = req.body;
    if (!title || !req.files || !req.files['audio']) {
      return res.status(400).send('Title and Audio file are required.');
    }

    const audioFile = req.files['audio'][0];
    const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

    const audioUrl = `/uploads/${audioFile.filename}`;
    const coverUrl = coverFile ? `/uploads/${coverFile.filename}` : '/images/default-cover.png';

    const artist = await Artist.findById(req.session.accountId);
    
    const newSong = new Song({
      title,
      artist: artist.name,
      artistId: artist._id,
      album: album || 'Single',
      audioUrl,
      coverUrl,
      isLocal: true
    });

    await newSong.save();

    artist.songs.push(newSong._id);
    await artist.save();

    res.redirect(`/${req.session.role}/${encodeURIComponent(artist.name)}/dashboard`);
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).send('Error uploading song: ' + err.message);
  }
});

// Manage Artist Songs
app.get('/my-songs', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'artist') {
    return res.status(403).send('Only artists can manage their songs.');
  }
  try {
    const artist = await Artist.findById(req.session.accountId).populate('songs');
    res.render('my-songs', { account: artist, songs: artist.songs });
  } catch (err) {
    res.status(500).send('Error loading manage songs page.');
  }
});

// Delete Song POST
app.post('/songs/delete/:id', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'artist') {
    return res.status(403).send('Only artists can delete songs.');
  }
  try {
    const songId = req.params.id;
    const song = await Song.findOne({ _id: songId, artistId: req.session.accountId });
    if (!song) {
      return res.status(404).send('Song not found or not owned by you.');
    }

    // Delete files if they exist
    if (song.audioUrl) {
      const audioPath = path.join(__dirname, 'public', song.audioUrl);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
    if (song.coverUrl && !song.coverUrl.startsWith('/images/default-cover') && !song.coverUrl.startsWith('http') && !song.coverUrl.startsWith('https')) {
      const coverPath = path.join(__dirname, 'public', song.coverUrl);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await Song.findByIdAndDelete(songId);

    // Remove reference from Artist
    await Artist.findByIdAndUpdate(req.session.accountId, {
      $pull: { songs: songId }
    });

    res.redirect('/my-songs');
  } catch (err) {
    console.error('Delete song error:', err);
    res.status(500).send('Error deleting song.');
  }
});

// Playlists Library GET
app.get('/library/playlists', isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) return res.redirect('/logout');

    let playlists = [];
    if (req.session.role === 'user') {
      playlists = loggedInUser.playlists;
    }

    res.render('playlists', {
      account: loggedInUser,
      playlists: playlists
    });
  } catch (err) {
    res.status(500).send('Error loading playlists library.');
  }
});


// Create Playlist POST (form-based, redirects)
app.post('/playlists', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).send('Only users can create playlists.');
  }
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).send('Playlist name is required.');

    const user = await User.findById(req.session.accountId);
    const newPlaylist = new Playlist({
      name,
      description: description || '',
      createdBy: user._id,
      songs: []
    });

    await newPlaylist.save();
    user.playlists.push(newPlaylist._id);
    await user.save();

    res.redirect('/library/playlists');
  } catch (err) {
    res.status(500).send('Error creating playlist.');
  }
});

// Create Playlist API (JSON response, for modal)
app.post('/playlist/create', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).json({ error: 'Only users can create playlists.' });
  }
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Playlist name is required.' });

    const user = await User.findById(req.session.accountId);
    const newPlaylist = new Playlist({
      name,
      description: description || '',
      createdBy: user._id,
      songs: []
    });

    await newPlaylist.save();
    user.playlists.push(newPlaylist._id);
    await user.save();

    res.json({ message: 'Playlist created', playlist: newPlaylist });
  } catch (err) {
    res.status(500).json({ error: 'Error creating playlist.' });
  }
});

// Add Song to Playlist API
app.post('/playlists/:id/add-song', isAuthenticated, async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { songId, title, artist, album, coverUrl, spotifyId, isLocal } = req.body;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

    let targetSongId;

    if (isLocal === 'true' || isLocal === true) {
      targetSongId = songId;
    } else {
      let song = await Song.findOne({ spotifyId: spotifyId });
      if (!song) {
        song = new Song({
          title: title || 'Unknown Track',
          artist: artist || 'Unknown Artist',
          album: album || 'Unknown Album',
          coverUrl: coverUrl || 'https://placehold.co/300x300',
          spotifyId: spotifyId,
          isLocal: false
        });
        await song.save();
      }
      targetSongId = song._id;
    }

    if (!playlist.songs.includes(targetSongId)) {
      playlist.songs.push(targetSongId);
      await playlist.save();
    }

    res.json({ message: 'Song added successfully!' });
  } catch (err) {
    console.error('Add Song Error:', err);
    res.status(500).json({ error: 'Error adding song.' });
  }
});

// Like Song / Toggle Liked Songs API
app.post('/playlists/like-song', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).json({ error: 'Only users can like songs.' });
  }
  try {
    const { songId, title, artist, album, coverUrl, spotifyId, isLocal } = req.body;
    const userId = req.session.accountId;

    const user = await User.findById(userId).populate('playlists');
    let likedPlaylist = user.playlists.find(p => p.name === 'Liked Songs');
    if (!likedPlaylist) {
      likedPlaylist = new Playlist({
        name: 'Liked Songs',
        description: 'Your favorite songs',
        createdBy: user._id,
        songs: []
      });
      await likedPlaylist.save();
      user.playlists.push(likedPlaylist._id);
      await user.save();
    }

    // Resolve song document
    let targetSong;
    if (isLocal === 'true' || isLocal === true) {
      targetSong = await Song.findById(songId);
    } else {
      targetSong = await Song.findOne({ spotifyId });
      if (!targetSong) {
        targetSong = new Song({
          title: title || 'Unknown Track',
          artist: artist || 'Unknown Artist',
          album: album || 'Unknown Album',
          coverUrl: coverUrl || 'https://placehold.co/300x300',
          spotifyId,
          isLocal: false
        });
        await targetSong.save();
      }
    }

    if (!targetSong) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    const targetSongId = targetSong._id;

    // Toggle song in liked playlist
    const playlistIndex = likedPlaylist.songs.findIndex(id => id.toString() === targetSongId.toString());
    let liked = false;
    if (playlistIndex === -1) {
      likedPlaylist.songs.push(targetSongId);
      liked = true;
    } else {
      likedPlaylist.songs.splice(playlistIndex, 1);
    }
    await likedPlaylist.save();

    // Also toggle user ID in Song.likes for analytics
    const songLikeIndex = targetSong.likes ? targetSong.likes.findIndex(id => id.toString() === userId.toString()) : -1;
    if (liked && songLikeIndex === -1) {
      await Song.findByIdAndUpdate(targetSongId, { $addToSet: { likes: userId } });
    } else if (!liked && songLikeIndex !== -1) {
      await Song.findByIdAndUpdate(targetSongId, { $pull: { likes: userId } });
    }

    const updatedSong = await Song.findById(targetSongId);
    const likeCount = updatedSong && updatedSong.likes ? updatedSong.likes.length : 0;

    res.json({ message: liked ? 'Added to Liked Songs' : 'Removed from Liked Songs', liked, likeCount });
  } catch (err) {
    console.error('Like Song Error:', err);
    res.status(500).json({ error: 'Error liking song.' });
  }
});


// Delete Playlist POST
app.post('/playlists/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const playlistId = req.params.id;
    const playlist = await Playlist.findOne({ _id: playlistId, createdBy: req.session.accountId });
    if (!playlist) return res.status(404).send('Playlist not found or not owned by you.');

    if (playlist.name === 'Liked Songs') {
      return res.status(400).send('You cannot delete the Liked Songs playlist.');
    }

    await Playlist.findByIdAndDelete(playlistId);
    await User.findByIdAndUpdate(req.session.accountId, {
      $pull: { playlists: playlistId }
    });

    res.redirect('/library/playlists');
  } catch (err) {
    res.status(500).send('Error deleting playlist.');
  }
});

// Merge Playlists POST
app.post('/playlists/merge', isAuthenticated, async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).send('Only users can merge playlists.');
  }
  try {
    const { sourcePlaylistId, targetPlaylistId } = req.body;
    if (!sourcePlaylistId || !targetPlaylistId) {
      return res.status(400).send('Source and Target playlists are required.');
    }

    const sourcePlaylist = await Playlist.findOne({ _id: sourcePlaylistId, createdBy: req.session.accountId });
    const targetPlaylist = await Playlist.findOne({ _id: targetPlaylistId, createdBy: req.session.accountId });

    if (!sourcePlaylist || !targetPlaylist) {
      return res.status(404).send('One or both playlists not found.');
    }

    sourcePlaylist.songs.forEach(songId => {
      if (!targetPlaylist.songs.includes(songId)) {
        targetPlaylist.songs.push(songId);
      }
    });

    await targetPlaylist.save();
    res.redirect('/library/playlists');
  } catch (err) {
    res.status(500).send('Error merging playlists.');
  }
});

// Remove Song from Playlist POST
app.post('/playlists/:id/remove-song', isAuthenticated, async (req, res) => {
  try {
    const playlistId = req.params.id;
    const { songId } = req.body;
    const playlist = await Playlist.findOne({ _id: playlistId, createdBy: req.session.accountId });
    if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

    playlist.songs = playlist.songs.filter(id => id.toString() !== songId.toString());
    await playlist.save();
    res.json({ message: 'Song removed from playlist.' });
  } catch (err) {
    res.status(500).json({ error: 'Error removing song.' });
  }
});

// --- Album Detail Route ---
app.get('/album/:id', isAuthenticated, async (req, res) => {
  const albumId = req.params.id;
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    const albumData = await spotifyApi.getAlbum(albumId);
    const album = albumData.body;

    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];

    res.render('album-detail', {
      account: loggedInUser,
      album: album,
      userPlaylists: userPlaylists
    });
  } catch (error) {
    console.error("Error fetching album details:", error);
    res.status(500).send("Could not fetch this album.");
  }
});

// --- Track Detail Route ---
app.get('/track/:id', isAuthenticated, async (req, res) => {
  const trackId = req.params.id;
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    let track = null;
    let isLocal = false;

    // 1. Try fetching from Local DB
    if (mongoose.isValidObjectId(trackId)) {
      const song = await Song.findById(trackId);
      if (song) {
        isLocal = true;
        track = {
          id: song._id.toString(),
          name: song.title,
          artist: song.artist,
          album: song.album || 'Single',
          coverUrl: song.coverUrl || '/images/default-cover.png',
          audioUrl: song.audioUrl,
          isLocal: true,
          spotifyId: song.spotifyId || ''
        };
      }
    }

    // 2. Try fetching from mock Spotify
    if (!track) {
      const { MOCK_TRACKS } = require('./utils/spotifyMock');
      const trackData = MOCK_TRACKS.find(t => t.id === trackId);
      if (trackData) {
        track = {
          id: trackData.id,
          name: trackData.name,
          artist: trackData.artists.map(a => a.name).join(', '),
          album: trackData.album.name,
          coverUrl: trackData.album.images[0]?.url || '',
          audioUrl: trackData.preview_url || trackData.audioUrl || '',
          isLocal: false,
          spotifyId: trackData.id
        };
      }
    }

    // 3. Try fetching from JioSaavn direct getSongById
    if (!track) {
      const saavnTrack = await saavnApi.getSongById(trackId);
      if (saavnTrack) {
        track = {
          id: saavnTrack.id,
          name: saavnTrack.name,
          artist: saavnTrack.artists.map(a => a.name).join(', '),
          album: saavnTrack.album.name,
          coverUrl: saavnTrack.album.images[0]?.url || '',
          audioUrl: saavnTrack.audioUrl || '',
          isLocal: false,
          spotifyId: ''
        };
      }
    }

    // Fallback if not found
    if (!track) {
      track = {
        id: trackId,
        name: 'Unknown Track',
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        coverUrl: '/images/default-cover.png',
        audioUrl: '',
        isLocal: false,
        spotifyId: ''
      };
    }

    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];

    res.render('track-detail', {
      account: loggedInUser,
      track: track,
      userPlaylists: userPlaylists
    });
  } catch (error) {
    console.error("Error fetching track details:", error);
    res.status(500).send("Could not fetch track details.");
  }
});

// --- Profile Route ---
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId).populate('songs');

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    res.render('profile', {
      account: loggedInUser,
      user: req.session.role === 'user' ? loggedInUser : null,
      artist: req.session.role === 'artist' ? loggedInUser : null
    });
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).send('Error loading profile page.');
  }
});

// --- Support Route ---
app.get('/support', isAuthenticated, async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId)
      : await Artist.findById(req.session.accountId);

    if (!loggedInUser) {
      return res.redirect('/logout');
    }

    res.render('support', {
      account: loggedInUser
    });
  } catch (err) {
    res.status(500).send('Error loading support page.');
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// API Routes
app.use('/artists', artistRoutes);
app.use('/users', userRoutes);
app.use('/playlists', playlistRoutes);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});