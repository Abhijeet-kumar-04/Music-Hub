const User = require('../models/user');
const Playlist = require('../models/playlist');

const isAuthenticated = async (req, res, next) => {
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
};

module.exports = {
  isAuthenticated
};
