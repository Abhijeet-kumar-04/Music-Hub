const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// View routes
router.get('/:role/:name/dashboard', isAuthenticated, musicController.getDashboard);
router.get('/category/:id', isAuthenticated, musicController.getCategory);
router.get('/browse/new-releases', isAuthenticated, musicController.getNewReleases);
router.get('/playlist/create', isAuthenticated, musicController.getCreatePlaylistPage);
router.get('/playlist/:id', isAuthenticated, musicController.getPlaylistDetail);
router.get('/search', isAuthenticated, musicController.searchMusic);
router.get('/test-player', isAuthenticated, musicController.getTestPlayer);
router.get('/browse/artists', isAuthenticated, musicController.getArtists);
router.get('/artist/:id', isAuthenticated, musicController.getArtistDetail);
router.get('/songs/upload', isAuthenticated, musicController.getUploadPage);
router.post('/songs/upload', isAuthenticated, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), musicController.uploadSong);
router.get('/my-songs', isAuthenticated, musicController.getMySongs);
router.post('/songs/delete/:id', isAuthenticated, musicController.deleteSong);
router.get('/library/playlists', isAuthenticated, musicController.getPlaylistsLibrary);
router.post('/playlists', isAuthenticated, musicController.createPlaylistForm);
router.post('/playlists/:id/delete', isAuthenticated, musicController.deletePlaylist);
router.post('/playlists/merge', isAuthenticated, musicController.mergePlaylists);
router.get('/album/:id', isAuthenticated, musicController.getAlbum);
router.get('/track/:id', isAuthenticated, musicController.getTrack);
router.get('/profile', isAuthenticated, musicController.getProfile);
router.get('/support', isAuthenticated, musicController.getSupport);

// API routes
router.get('/api/category/:id/playlists', isAuthenticated, musicController.apiGetCategoryPlaylists);
router.get('/api/search', isAuthenticated, musicController.apiSearch);
router.get('/api/songs/category', isAuthenticated, musicController.apiGetCategorySongs);
router.post('/artist/:id/follow', isAuthenticated, musicController.followArtist);
router.get('/api/artist/:id/albums', isAuthenticated, musicController.apiGetArtistAlbums);
router.post('/playlist/create', isAuthenticated, musicController.apiCreatePlaylist);
router.post('/playlists/:id/add-song', isAuthenticated, musicController.apiAddSongToPlaylist);
router.post('/playlists/like-song', isAuthenticated, musicController.apiLikeSong);
router.post('/playlists/:id/remove-song', isAuthenticated, musicController.apiRemoveSongFromPlaylist);

module.exports = router;
