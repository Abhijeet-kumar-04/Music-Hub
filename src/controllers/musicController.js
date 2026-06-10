const musicService = require('../services/musicService');
const spotifyApi = require('../config/spotify');
const Artist = require('../models/artist');
const Song = require('../models/song');
const User = require('../models/user');
const Playlist = require('../models/playlist');
const saavnApi = require('../utils/saavnApi');

const getDashboard = async (req, res) => {
  try {
    const data = await musicService.getDashboardData(req.session.accountId, req.session.role);
    res.render('dashboard', {
      account: data.loggedInUser,
      items: data.categories,
      trendingHits: data.trendingHits,
      recommendedSongs: data.recommendedSongs,
      topArtists: data.topArtists,
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error('Dashboard Controller Error:', error);
    res.status(500).send('An error occurred while loading the dashboard.');
  }
};

const getCategory = async (req, res) => {
  try {
    const data = await musicService.getCategoryPlaylists(req.params.id, req.session.accountId, req.session.role);
    res.render('category-playlists', {
      account: data.loggedInUser,
      playlists: data.playlists,
      categoryName: data.categoryName,
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error('Category Controller Error:', error);
    res.status(500).send('An error occurred while loading category playlists.');
  }
};

const getNewReleases = async (req, res) => {
  try {
    const data = await musicService.getNewReleases(req.session.accountId, req.session.role);
    res.render('new-releases', {
      account: data.loggedInUser,
      albums: data.albums,
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error('New Releases Controller Error:', error);
    res.status(500).send('Could not fetch new releases.');
  }
};

const getPlaylistDetail = async (req, res) => {
  try {
    const data = await musicService.getPlaylistDetail(req.params.id, req.session.accountId, req.session.role);
    res.render('playlist-detail', {
      account: data.loggedInUser,
      playlist: data.playlist,
      isLocalPlaylist: data.isLocalPlaylist,
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error('Playlist Detail Controller Error:', error);
    res.status(500).send('Could not fetch playlist details.');
  }
};

const searchMusic = async (req, res) => {
  const query = req.query.q;
  if (!query) return res.redirect('/');
  try {
    const data = await musicService.searchMusic(query, req.session.accountId, req.session.role);
    res.render('search-results', {
      account: data.loggedInUser,
      tracks: data.tracks,
      query: query,
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error('Search Controller Error:', error);
    res.status(500).send('An error occurred during search.');
  }
};

const getTestPlayer = async (req, res) => {
  try {
    const searchData = await spotifyApi.searchTracks("Blinding Lights by The Weeknd");
    const track = searchData.body.tracks.items[0];
    res.render('test-player', { track });
  } catch (error) {
    console.error('Test Player Controller Error:', error);
    res.status(500).send('Could not load test player.');
  }
};

const apiGetCategoryPlaylists = async (req, res) => {
  try {
    const categoryInfo = await spotifyApi.getCategory(req.params.id);
    const categoryName = categoryInfo.body.name;
    const playlistData = await spotifyApi.searchPlaylists(categoryName, {
      country: 'IN',
      limit: 20,
      offset: parseInt(req.query.offset) || 0
    });
    res.json(playlistData.body.playlists.items);
  } catch (error) {
    console.error('Category Playlists API Error:', error);
    res.status(500).json({ error: 'Error fetching categories playlists' });
  }
};

const apiSearch = async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.json([]);
  try {
    const results = await musicService.paginatedSearch(q, parseInt(page) || 1);
    res.json(results);
  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

const apiGetCategorySongs = async (req, res) => {
  const { category } = req.query;
  if (!category) return res.json([]);
  try {
    const tracks = await saavnApi.searchSongs(category, 1, 12);
    res.json(tracks);
  } catch (err) {
    console.error('Category songs API error:', err);
    res.status(500).json({ error: 'Failed to load category' });
  }
};

const followArtist = async (req, res) => {
  try {
    const result = await musicService.toggleFollowArtist(req.params.id, req.session.accountId, req.session.role);
    res.json(result);
  } catch (error) {
    console.error('Follow Artist API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to follow/unfollow' });
  }
};

const getArtists = async (req, res) => {
  try {
    const data = await musicService.getArtistsList(req.query.q, req.session.accountId, req.session.role);
    res.render('browse-artists', {
      account: data.loggedInUser,
      artists: data.artists,
      pageTitle: req.query.q ? `Results for "${req.query.q}"` : 'Top Artists',
      query: req.query.q || '',
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error('Artists Controller Error:', error);
    res.status(500).send('Could not load artists page.');
  }
};

const getArtistDetail = async (req, res) => {
  try {
    const data = await musicService.getArtistDetail(req.params.id, req.session.accountId, req.session.role);
    res.render('artist-detail', {
      account: data.loggedInUser,
      artist: data.artist,
      tracks: data.tracks,
      albums: data.albums,
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error('Artist Detail Controller Error:', error);
    res.status(500).send("Could not load artist detail page.");
  }
};

const apiGetArtistAlbums = async (req, res) => {
  try {
    const artistAlbumsData = await spotifyApi.getArtistAlbums(req.params.id, {
      limit: 10,
      offset: parseInt(req.query.offset) || 0,
      country: 'IN'
    });
    res.json(artistAlbumsData.body.items);
  } catch (error) {
    console.error('Artist Albums API Error:', error);
    res.status(500).json({ error: 'Error fetching albums' });
  }
};

const getUploadPage = async (req, res) => {
  if (req.session.role !== 'artist') {
    return res.status(403).send('Only artists can upload songs.');
  }
  try {
    const artist = await Artist.findById(req.session.accountId);
    res.render('upload-song', { account: artist, userPlaylists: [] });
  } catch (err) {
    res.status(500).send('Error loading upload page.');
  }
};

const uploadSong = async (req, res) => {
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
    const artist = await musicService.createUploadedSong(
      title,
      album,
      audioFile.filename,
      coverFile ? coverFile.filename : null,
      req.session.accountId
    );
    res.redirect(`/${req.session.role}/${encodeURIComponent(artist.name)}/dashboard`);
  } catch (error) {
    console.error('Upload Song Controller Error:', error);
    res.status(500).send('Error uploading song: ' + error.message);
  }
};

const getMySongs = async (req, res) => {
  if (req.session.role !== 'artist') {
    return res.status(403).send('Only artists can manage their songs.');
  }
  try {
    const artist = await Artist.findById(req.session.accountId).populate('songs');
    res.render('my-songs', { account: artist, songs: artist.songs, userPlaylists: [] });
  } catch (err) {
    res.status(500).send('Error loading manage songs page.');
  }
};

const deleteSong = async (req, res) => {
  if (req.session.role !== 'artist') {
    return res.status(403).send('Only artists can delete songs.');
  }
  try {
    await musicService.deleteUploadedSong(req.params.id, req.session.accountId);
    res.redirect('/my-songs');
  } catch (error) {
    console.error('Delete Song Controller Error:', error);
    res.status(500).send('Error deleting song.');
  }
};

const getPlaylistsLibrary = async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);
    if (!loggedInUser) return res.redirect('/logout');
    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];
    res.render('playlists', {
      account: loggedInUser,
      playlists: userPlaylists,
      userPlaylists: userPlaylists
    });
  } catch (err) {
    res.status(500).send('Error loading playlists library.');
  }
};

const createPlaylistForm = async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).send('Only users can create playlists.');
  }
  try {
    await musicService.createPlaylist(req.body.name, req.body.description, req.session.accountId);
    res.redirect('/library/playlists');
  } catch (err) {
    res.status(500).send('Error creating playlist.');
  }
};

const apiCreatePlaylist = async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).json({ error: 'Only users can create playlists.' });
  }
  try {
    const newPlaylist = await musicService.createPlaylist(req.body.name, req.body.description, req.session.accountId);
    res.json({ message: 'Playlist created', playlist: newPlaylist });
  } catch (err) {
    res.status(500).json({ error: 'Error creating playlist.' });
  }
};

const apiAddSongToPlaylist = async (req, res) => {
  try {
    await musicService.addSongToPlaylist(req.params.id, req.body);
    res.json({ message: 'Song added successfully!' });
  } catch (err) {
    console.error('Add Song Controller Error:', err);
    res.status(500).json({ error: 'Error adding song.' });
  }
};

const apiLikeSong = async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).json({ error: 'Only users can like songs.' });
  }
  try {
    const result = await musicService.toggleLikeSong(req.body, req.session.accountId);
    res.json({ message: result.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs', liked: result.liked, likeCount: result.likeCount });
  } catch (err) {
    console.error('Like Song API Error:', err);
    res.status(500).json({ error: 'Error liking song.' });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    await musicService.deletePlaylist(req.params.id, req.session.accountId);
    res.redirect('/library/playlists');
  } catch (err) {
    res.status(500).send(err.message || 'Error deleting playlist.');
  }
};

const mergePlaylists = async (req, res) => {
  if (req.session.role !== 'user') {
    return res.status(403).send('Only users can merge playlists.');
  }
  try {
    await musicService.mergePlaylists(req.body.sourcePlaylistId, req.body.targetPlaylistId, req.session.accountId);
    res.redirect('/library/playlists');
  } catch (err) {
    res.status(500).send('Error merging playlists.');
  }
};

const apiRemoveSongFromPlaylist = async (req, res) => {
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
};

const getAlbum = async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);
    if (!loggedInUser) return res.redirect('/logout');

    const albumData = await spotifyApi.getAlbum(req.params.id);
    const album = albumData.body;
    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];

    res.render('album-detail', {
      account: loggedInUser,
      album: album,
      userPlaylists: userPlaylists
    });
  } catch (error) {
    console.error("Album Detail Controller Error:", error);
    res.status(500).send("Could not fetch this album.");
  }
};

const getTrack = async (req, res) => {
  try {
    const data = await musicService.getTrackDetail(req.params.id, req.session.accountId, req.session.role);
    res.render('track-detail', {
      account: data.loggedInUser,
      track: data.track,
      userPlaylists: data.userPlaylists
    });
  } catch (error) {
    console.error("Track Detail Controller Error:", error);
    res.status(500).send("Could not fetch track details.");
  }
};

const getProfile = async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId).populate('songs');
    if (!loggedInUser) return res.redirect('/logout');
    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];
    res.render('profile', {
      account: loggedInUser,
      user: req.session.role === 'user' ? loggedInUser : null,
      artist: req.session.role === 'artist' ? loggedInUser : null,
      userPlaylists
    });
  } catch (err) {
    console.error('Profile Controller Error:', err);
    res.status(500).send('Error loading profile page.');
  }
};

const getSupport = async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);
    if (!loggedInUser) return res.redirect('/logout');
    const userPlaylists = req.session.role === 'user' ? loggedInUser.playlists : [];
    res.render('support', { account: loggedInUser, userPlaylists });
  } catch (err) {
    res.status(500).send('Error loading support page.');
  }
};

const getCreatePlaylistPage = async (req, res) => {
  try {
    const loggedInUser = req.session.role === 'user'
      ? await User.findById(req.session.accountId).populate('playlists')
      : await Artist.findById(req.session.accountId);
    const userPlaylists = req.session.role === 'user' ? (loggedInUser.playlists || []) : [];
    res.render('create-playlist', { account: loggedInUser, userPlaylists });
  } catch (err) {
    res.status(500).send('Error loading create playlist page.');
  }
};

module.exports = {
  getDashboard,
  getCategory,
  getNewReleases,
  getPlaylistDetail,
  searchMusic,
  getTestPlayer,
  apiGetCategoryPlaylists,
  apiSearch,
  apiGetCategorySongs,
  followArtist,
  getArtists,
  getArtistDetail,
  apiGetArtistAlbums,
  getUploadPage,
  uploadSong,
  getMySongs,
  deleteSong,
  getPlaylistsLibrary,
  getCreatePlaylistPage,
  createPlaylistForm,
  apiCreatePlaylist,
  apiAddSongToPlaylist,
  apiLikeSong,
  deletePlaylist,
  mergePlaylists,
  apiRemoveSongFromPlaylist,
  getAlbum,
  getTrack,
  getProfile,
  getSupport
};
