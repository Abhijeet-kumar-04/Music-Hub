const User = require('../models/user');
const Artist = require('../models/artist');
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const saavnApi = require('../utils/saavnApi');
const spotifyApi = require('../config/spotify');
const { getDiverseTracks } = require('../utils/shuffle');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const getDashboardData = async (accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId).populate('playlists')
    : await Artist.findById(accountId);

  if (!loggedInUser) {
    throw new Error('User not found');
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

  const userPlaylists = role === 'user' ? (loggedInUser.playlists || []) : [];

  return {
    loggedInUser,
    categories,
    trendingHits,
    recommendedSongs,
    topArtists,
    userPlaylists
  };
};

const getCategoryPlaylists = async (categoryId, accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId).populate('playlists')
    : await Artist.findById(accountId);

  if (!loggedInUser) {
    throw new Error('User not found');
  }

  const categoryInfo = await spotifyApi.getCategory(categoryId);
  const categoryName = categoryInfo.body.name;
  
  const playlistData = await spotifyApi.searchPlaylists(categoryName, {
    country: 'IN',
    limit: 20
  });
  const playlists = playlistData.body.playlists.items;
  const userPlaylists = role === 'user' ? (loggedInUser.playlists || []) : [];

  return {
    loggedInUser,
    categoryName,
    playlists,
    userPlaylists
  };
};

const getNewReleases = async (accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId).populate('playlists')
    : await Artist.findById(accountId);

  if (!loggedInUser) {
    throw new Error('User not found');
  }

  const newReleasesData = await spotifyApi.getNewReleases({
    limit: 20,
    country: 'IN'
  });
  const albums = newReleasesData.body.albums.items;
  const userPlaylists = role === 'user' ? (loggedInUser.playlists || []) : [];

  return {
    loggedInUser,
    albums,
    userPlaylists
  };
};

const getPlaylistDetail = async (playlistId, accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId).populate('playlists')
    : await Artist.findById(accountId);

  if (!loggedInUser) {
    throw new Error('User not found');
  }

  let playlist;
  let isLocalPlaylist = false;

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

      playlist.tracks.items = playlist.tracks.items.map(item => {
        if (item.track) {
          item.track.audioUrl = item.track.preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        }
        return item;
      });
    }
  }

  const userPlaylists = role === 'user' ? loggedInUser.playlists : [];

  return {
    loggedInUser,
    playlist,
    isLocalPlaylist,
    userPlaylists
  };
};

const searchMusic = async (query, accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId).populate('playlists')
    : await Artist.findById(accountId);

  if (!loggedInUser) {
    throw new Error('User not found');
  }

  const localSongs = await Song.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { artist: { $regex: query, $options: 'i' } },
      { album: { $regex: query, $options: 'i' } }
    ]
  });

  let saavnTracks = [];
  try {
    saavnTracks = await saavnApi.searchSongs(query);
  } catch (err) {
    console.error("JioSaavn search failed, using empty results:", err);
  }

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
  const userPlaylists = role === 'user' ? loggedInUser.playlists : [];

  return {
    loggedInUser,
    tracks: allTracks,
    userPlaylists
  };
};

const paginatedSearch = async (query, pageNum) => {
  const saavnTracks = await saavnApi.searchSongs(query, pageNum, 20);
  let localFormatted = [];
  if (pageNum === 1) {
    const localSongs = await Song.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { artist: { $regex: query, $options: 'i' } }
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
  return [...localFormatted, ...saavnTracks];
};

const toggleFollowArtist = async (artistId, userId, role) => {
  if (role !== 'user') {
    throw new Error('Only users can follow artists.');
  }

  if (!mongoose.isValidObjectId(artistId)) {
    throw new Error('Invalid artist ID.');
  }

  const artist = await Artist.findById(artistId);
  if (!artist) {
    throw new Error('Artist not found.');
  }

  const alreadyFollowing = artist.followers && artist.followers.some(f => f.toString() === userId.toString());
  if (alreadyFollowing) {
    await Artist.findByIdAndUpdate(artistId, { $pull: { followers: userId } });
    const updated = await Artist.findById(artistId);
    const followersCount = updated.followers ? updated.followers.length : 0;
    const songLikes = updated.songs ? (await Song.find({ _id: { $in: updated.songs } })).reduce((a, s) => a + (s.likes ? s.likes.length : 0), 0) : 0;
    return { following: false, followersCount, monthlyListeners: (followersCount * 15) + (songLikes * 4) + 120 };
  } else {
    await Artist.findByIdAndUpdate(artistId, { $addToSet: { followers: userId } });
    const updated = await Artist.findById(artistId);
    const followersCount = updated.followers ? updated.followers.length : 0;
    const songLikes = updated.songs ? (await Song.find({ _id: { $in: updated.songs } })).reduce((a, s) => a + (s.likes ? s.likes.length : 0), 0) : 0;
    return { following: true, followersCount, monthlyListeners: (followersCount * 15) + (songLikes * 4) + 120 };
  }
};

const getArtistsList = async (query, accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId).populate('playlists')
    : await Artist.findById(accountId);

  if (!loggedInUser) {
    throw new Error('User not found');
  }

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

  let spotifyArtists = [];
  try {
    if (query) {
      const searchData = await spotifyApi.searchArtists(query, { limit: 20, country: 'IN' });
      spotifyArtists = searchData.body.artists.items;
    } else {
      const searchData = await spotifyApi.searchArtists("Top Artists India", { limit: 20, country: 'IN' });
      spotifyArtists = searchData.body.artists.items;
    }
  } catch (err) {
    console.error("Spotify artists fetch failed:", err);
  }

  const userPlaylists = role === 'user' ? (loggedInUser.playlists || []) : [];

  return {
    loggedInUser,
    artists: [...formattedLocalArtists, ...spotifyArtists],
    userPlaylists
  };
};

const getArtistDetail = async (artistId, accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId)
    : await Artist.findById(accountId);

  if (!loggedInUser) {
    throw new Error('User not found');
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
        followers: localArtist.followers || []
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
  if (role === 'user') {
    const user = await User.findById(accountId).populate('playlists');
    if (user) {
      userPlaylists = user.playlists;
    }
  }

  return {
    loggedInUser,
    artist,
    tracks,
    albums,
    userPlaylists
  };
};

const createUploadedSong = async (title, album, audioFilename, coverFilename, accountId) => {
  const artist = await Artist.findById(accountId);
  if (!artist) throw new Error('Artist not found');

  const audioUrl = `/uploads/${audioFilename}`;
  const coverUrl = coverFilename ? `/uploads/${coverFilename}` : '/images/default-cover.png';

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

  return artist;
};

const deleteUploadedSong = async (songId, accountId) => {
  const song = await Song.findOne({ _id: songId, artistId: accountId });
  if (!song) {
    throw new Error('Song not found or not owned by you.');
  }

  if (song.audioUrl) {
    const audioPath = path.join(__dirname, '../../public', song.audioUrl);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
  if (song.coverUrl && !song.coverUrl.startsWith('/images/default-cover') && !song.coverUrl.startsWith('http') && !song.coverUrl.startsWith('https')) {
    const coverPath = path.join(__dirname, '../../public', song.coverUrl);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
  }

  await Song.findByIdAndDelete(songId);
  await Artist.findByIdAndUpdate(accountId, { $pull: { songs: songId } });
};

const createPlaylist = async (name, description, accountId) => {
  const user = await User.findById(accountId);
  if (!user) throw new Error('User not found');

  const newPlaylist = new Playlist({
    name,
    description: description || '',
    createdBy: user._id,
    songs: []
  });

  await newPlaylist.save();
  user.playlists.push(newPlaylist._id);
  await user.save();
  return newPlaylist;
};

const addSongToPlaylist = async (playlistId, songData) => {
  const { songId, title, artist, album, coverUrl, spotifyId, isLocal } = songData;
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new Error('Playlist not found');

  let targetSongId;
  if (isLocal === 'true' || isLocal === true) {
    targetSongId = songId;
  } else {
    let song = await Song.findOne({ spotifyId });
    if (!song) {
      song = new Song({
        title: title || 'Unknown Track',
        artist: artist || 'Unknown Artist',
        album: album || 'Unknown Album',
        coverUrl: coverUrl || 'https://placehold.co/300x300',
        spotifyId,
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
};

const toggleLikeSong = async (songData, userId) => {
  const { songId, title, artist, album, coverUrl, spotifyId, isLocal } = songData;
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

  if (!targetSong) throw new Error('Song not found.');

  const targetSongId = targetSong._id;
  const playlistIndex = likedPlaylist.songs.findIndex(id => id.toString() === targetSongId.toString());
  let liked = false;
  if (playlistIndex === -1) {
    likedPlaylist.songs.push(targetSongId);
    liked = true;
  } else {
    likedPlaylist.songs.splice(playlistIndex, 1);
  }
  await likedPlaylist.save();

  const songLikeIndex = targetSong.likes ? targetSong.likes.findIndex(id => id.toString() === userId.toString()) : -1;
  if (liked && songLikeIndex === -1) {
    await Song.findByIdAndUpdate(targetSongId, { $addToSet: { likes: userId } });
  } else if (!liked && songLikeIndex !== -1) {
    await Song.findByIdAndUpdate(targetSongId, { $pull: { likes: userId } });
  }

  const updatedSong = await Song.findById(targetSongId);
  const likeCount = updatedSong && updatedSong.likes ? updatedSong.likes.length : 0;

  return { liked, likeCount };
};

const deletePlaylist = async (playlistId, accountId) => {
  const playlist = await Playlist.findOne({ _id: playlistId, createdBy: accountId });
  if (!playlist) throw new Error('Playlist not found or not owned by you.');
  if (playlist.name === 'Liked Songs') throw new Error('You cannot delete the Liked Songs playlist.');

  await Playlist.findByIdAndDelete(playlistId);
  await User.findByIdAndUpdate(accountId, { $pull: { playlists: playlistId } });
};

const mergePlaylists = async (sourcePlaylistId, targetPlaylistId, accountId) => {
  const sourcePlaylist = await Playlist.findOne({ _id: sourcePlaylistId, createdBy: accountId });
  const targetPlaylist = await Playlist.findOne({ _id: targetPlaylistId, createdBy: accountId });

  if (!sourcePlaylist || !targetPlaylist) {
    throw new Error('One or both playlists not found.');
  }

  sourcePlaylist.songs.forEach(songId => {
    if (!targetPlaylist.songs.includes(songId)) {
      targetPlaylist.songs.push(songId);
    }
  });

  await targetPlaylist.save();
};

const getTrackDetail = async (trackId, accountId, role) => {
  const loggedInUser = role === 'user'
    ? await User.findById(accountId).populate('playlists')
    : await Artist.findById(accountId);

  if (!loggedInUser) throw new Error('User not found');

  let track = null;
  let isLocal = false;

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

  if (!track) {
    const { MOCK_TRACKS } = require('../utils/spotifyMock');
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

  const userPlaylists = role === 'user' ? loggedInUser.playlists : [];

  return {
    loggedInUser,
    track,
    userPlaylists
  };
};

module.exports = {
  getDashboardData,
  getCategoryPlaylists,
  getNewReleases,
  getPlaylistDetail,
  searchMusic,
  paginatedSearch,
  toggleFollowArtist,
  getArtistsList,
  getArtistDetail,
  createUploadedSong,
  deleteUploadedSong,
  createPlaylist,
  addSongToPlaylist,
  toggleLikeSong,
  deletePlaylist,
  mergePlaylists,
  getTrackDetail
};
