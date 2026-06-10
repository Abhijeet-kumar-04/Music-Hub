const SpotifyWebApiMock = require('../utils/spotifyMock');

const spotifyApi = new SpotifyWebApiMock({
  clientId: process.env.SPOTIFY_CLIENT_ID || 'mock_client_id',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'mock_client_secret'
});

module.exports = spotifyApi;
