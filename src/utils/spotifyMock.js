const MOCK_CATEGORIES = [
  { id: 'bollywood', name: 'Bollywood Hits', icons: [{ url: 'https://placehold.co/200x200/FF5733/FFFFFF?text=Bollywood' }] },
  { id: 'punjabi', name: 'Punjabi Beats', icons: [{ url: 'https://placehold.co/200x200/33FF57/FFFFFF?text=Punjabi' }] },
  { id: 'pop', name: 'Pop Essentials', icons: [{ url: 'https://placehold.co/200x200/3357FF/FFFFFF?text=Pop' }] },
  { id: 'lofi', name: 'Chill Lofi', icons: [{ url: 'https://placehold.co/200x200/F3FF33/FFFFFF?text=Lofi' }] },
  { id: 'indie', name: 'Indie Vibes', icons: [{ url: 'https://placehold.co/200x200/FF33F3/FFFFFF?text=Indie' }] }
];

const MOCK_TRACKS = [
  {
    id: '0eG08cBeKk0mzykKjw4hcQ',
    name: 'Kesariya',
    artists: [{ name: 'Arijit Singh' }, { name: 'Pritam' }],
    album: {
      id: 'brahmastra_album',
      name: 'Brahmastra',
      images: [
        { url: 'https://placehold.co/600x600/FF5733/FFFFFF?text=Kesariya' },
        { url: 'https://placehold.co/300x300/FF5733/FFFFFF?text=Kesariya' },
        { url: 'https://placehold.co/64x64/FF5733/FFFFFF?text=Kesariya' }
      ],
      artists: [{ name: 'Arijit Singh' }, { name: 'Pritam' }]
    },
    duration_ms: 268000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '0VjljW4Ki8iu49R44ED9Pq',
    name: 'Blinding Lights',
    artists: [{ name: 'The Weeknd' }],
    album: {
      id: 'after_hours_album',
      name: 'After Hours',
      images: [
        { url: 'https://placehold.co/600x600/121212/FFFFFF?text=After+Hours' },
        { url: 'https://placehold.co/300x300/121212/FFFFFF?text=After+Hours' },
        { url: 'https://placehold.co/64x64/121212/FFFFFF?text=After+Hours' }
      ],
      artists: [{ name: 'The Weeknd' }]
    },
    duration_ms: 200000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '5HCyWlXZJ4d6Z7a36QkXmH',
    name: 'STAY',
    artists: [{ name: 'The Kid LAROI' }, { name: 'Justin Bieber' }],
    album: {
      id: 'stay_album',
      name: 'F*CK LOVE 3: OVER YOU',
      images: [
        { url: 'https://placehold.co/600x600/3357FF/FFFFFF?text=STAY' },
        { url: 'https://placehold.co/300x300/3357FF/FFFFFF?text=STAY' },
        { url: 'https://placehold.co/64x64/3357FF/FFFFFF?text=STAY' }
      ],
      artists: [{ name: 'The Kid LAROI' }, { name: 'Justin Bieber' }]
    },
    duration_ms: 141000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: '5aAx2yezTd8zXrkmtKl66Z',
    name: 'Starboy',
    artists: [{ name: 'The Weeknd' }, { name: 'Daft Punk' }],
    album: {
      id: 'starboy_album',
      name: 'Starboy',
      images: [
        { url: 'https://placehold.co/600x600/E13300/FFFFFF?text=Starboy' },
        { url: 'https://placehold.co/300x300/E13300/FFFFFF?text=Starboy' },
        { url: 'https://placehold.co/64x64/E13300/FFFFFF?text=Starboy' }
      ],
      artists: [{ name: 'The Weeknd' }, { name: 'Daft Punk' }]
    },
    duration_ms: 230000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: '7qiZjo4ncm7EEJyrt36Fbf',
    name: 'Shape of You',
    artists: [{ name: 'Ed Sheeran' }],
    album: {
      id: 'divide_album',
      name: 'Divide',
      images: [
        { url: 'https://placehold.co/600x600/3A6073/FFFFFF?text=Divide' },
        { url: 'https://placehold.co/300x300/3A6073/FFFFFF?text=Divide' },
        { url: 'https://placehold.co/64x64/3A6073/FFFFFF?text=Divide' }
      ],
      artists: [{ name: 'Ed Sheeran' }]
    },
    duration_ms: 233000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: '1BxfEXR5wJmhuaqumhk05n',
    name: 'Cruel Summer',
    artists: [{ name: 'Taylor Swift' }],
    album: {
      id: 'lover_album',
      name: 'Lover',
      images: [
        { url: 'https://placehold.co/600x600/FFC300/FFFFFF?text=Lover' },
        { url: 'https://placehold.co/300x300/FFC300/FFFFFF?text=Lover' },
        { url: 'https://placehold.co/64x64/FFC300/FFFFFF?text=Lover' }
      ],
      artists: [{ name: 'Taylor Swift' }]
    },
    duration_ms: 178000,
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  }
];

const MOCK_PLAYLISTS = [
  {
    id: 'bollywood_romance',
    name: 'Bollywood Romance',
    description: 'Beautiful love songs from Bollywood movies.',
    images: [{ url: 'https://placehold.co/300x300/FF5733/FFFFFF?text=Romance' }],
    category: 'bollywood',
    tracks: [MOCK_TRACKS[0], MOCK_TRACKS[4]]
  },
  {
    id: 'punjabi_hits',
    name: 'Punjabi Beats',
    description: 'High energy Punjabi tracks to dance to.',
    images: [{ url: 'https://placehold.co/300x300/33FF57/FFFFFF?text=Punjabi+Hits' }],
    category: 'punjabi',
    tracks: [MOCK_TRACKS[2]]
  },
  {
    id: 'pop_essentials',
    name: 'Pop Essentials',
    description: 'The biggest pop anthems in the world right now.',
    images: [{ url: 'https://placehold.co/300x300/3357FF/FFFFFF?text=Pop+Essentials' }],
    category: 'pop',
    tracks: [MOCK_TRACKS[1], MOCK_TRACKS[2], MOCK_TRACKS[3], MOCK_TRACKS[4], MOCK_TRACKS[5]]
  },
  {
    id: 'chill_lofi',
    name: 'Midnight Lofi',
    description: 'Soft beats for late night relaxation or study.',
    images: [{ url: 'https://placehold.co/300x300/F3FF33/FFFFFF?text=Midnight+Lofi' }],
    category: 'lofi',
    tracks: [MOCK_TRACKS[1], MOCK_TRACKS[5]]
  },
  {
    id: 'indie_vibes',
    name: 'Indie Folk & Acoustic',
    description: 'Cozy acoustic tracks and fresh indie vibes.',
    images: [{ url: 'https://placehold.co/300x300/FF33F3/FFFFFF?text=Indie+Vibes' }],
    category: 'indie',
    tracks: [MOCK_TRACKS[0], MOCK_TRACKS[5]]
  }
];

const MOCK_ARTISTS = [
  {
    id: 'arijit_singh',
    name: 'Arijit Singh',
    images: [{ url: 'https://placehold.co/300x300/FF5733/FFFFFF?text=Arijit+Singh' }],
    followers: { total: 78900000 },
    topTracks: [MOCK_TRACKS[0]],
    albums: [
      { id: 'brahmastra_album', name: 'Brahmastra', images: [{ url: 'https://placehold.co/300x300/FF5733/FFFFFF?text=Brahmastra' }], release_date: '2022-09-09' }
    ]
  },
  {
    id: 'the_weeknd',
    name: 'The Weeknd',
    images: [{ url: 'https://placehold.co/300x300/121212/FFFFFF?text=The+Weeknd' }],
    followers: { total: 65400000 },
    topTracks: [MOCK_TRACKS[1], MOCK_TRACKS[3]],
    albums: [
      { id: 'after_hours_album', name: 'After Hours', images: [{ url: 'https://placehold.co/300x300/121212/FFFFFF?text=After+Hours' }], release_date: '2020-03-20' },
      { id: 'starboy_album', name: 'Starboy', images: [{ url: 'https://placehold.co/300x300/E13300/FFFFFF?text=Starboy' }], release_date: '2016-11-25' }
    ]
  },
  {
    id: 'taylor_swift',
    name: 'Taylor Swift',
    images: [{ url: 'https://placehold.co/300x300/FFC300/FFFFFF?text=Taylor+Swift' }],
    followers: { total: 98700000 },
    topTracks: [MOCK_TRACKS[5]],
    albums: [
      { id: 'lover_album', name: 'Lover', images: [{ url: 'https://placehold.co/300x300/FFC300/FFFFFF?text=Lover' }], release_date: '2019-08-23' }
    ]
  }
];

class SpotifyWebApiMock {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this._accessToken = '';
  }

  async clientCredentialsGrant() {
    return {
      statusCode: 200,
      body: {
        access_token: 'mock_access_token_' + Date.now(),
        expires_in: 3600
      }
    };
  }

  setAccessToken(token) {
    this._accessToken = token;
  }

  async getNewReleases(options = {}) {
    const items = MOCK_TRACKS.map(track => track.album);
    const uniqueAlbums = Array.from(new Set(items.map(a => a.name)))
      .map(name => items.find(a => a.name === name));

    return {
      statusCode: 200,
      body: {
        albums: {
          items: uniqueAlbums.slice(0, options.limit || 20)
        }
      }
    };
  }

  async getCategories(options = {}) {
    return {
      statusCode: 200,
      body: {
        categories: {
          items: MOCK_CATEGORIES.slice(0, options.limit || 20)
        }
      }
    };
  }

  async getCategory(categoryId) {
    const cat = MOCK_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) throw { statusCode: 404, message: 'Category not found' };
    return {
      statusCode: 200,
      body: cat
    };
  }

  async searchPlaylists(query, options = {}) {
    const results = MOCK_PLAYLISTS.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.category.toLowerCase().includes(query.toLowerCase())
    );
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    return {
      statusCode: 200,
      body: {
        playlists: {
          items: results.slice(offset, offset + limit)
        }
      }
    };
  }

  async getAlbum(albumId) {
    let albumMeta = null;
    for (const artist of MOCK_ARTISTS) {
      const found = artist.albums.find(a => a.id === albumId);
      if (found) {
        albumMeta = { ...found, artistName: artist.name };
        break;
      }
    }
    
    if (!albumMeta) {
      const trackWithAlbum = MOCK_TRACKS.find(t => t.album && t.album.id === albumId);
      if (trackWithAlbum) {
        albumMeta = {
          id: trackWithAlbum.album.id,
          name: trackWithAlbum.album.name,
          images: trackWithAlbum.album.images,
          artistName: trackWithAlbum.artists[0]?.name || 'Various Artists'
        };
      }
    }

    if (!albumMeta) {
      albumMeta = {
        id: albumId,
        name: 'Featured Album',
        images: [{ url: 'https://placehold.co/300x300/3A6073/FFFFFF?text=Album' }],
        artistName: 'Various Artists'
      };
    }

    const tracks = MOCK_TRACKS.filter(t => t.album && (t.album.id === albumId || t.album.name === albumMeta.name));

    return {
      statusCode: 200,
      body: {
        id: albumMeta.id,
        name: albumMeta.name,
        artists: [{ name: albumMeta.artistName }],
        images: albumMeta.images,
        release_date: albumMeta.release_date || '2026',
        tracks: {
          items: tracks.map(track => ({ track }))
        }
      }
    };
  }

  async getPlaylist(playlistId) {
    const pl = MOCK_PLAYLISTS.find(p => p.id === playlistId);
    if (!pl) throw { statusCode: 404, message: 'Playlist not found' };
    return {
      statusCode: 200,
      body: {
        id: pl.id,
        name: pl.name,
        description: pl.description,
        images: pl.images,
        tracks: {
          items: pl.tracks.map(track => ({ track }))
        }
      }
    };
  }

  async getTracks(trackIds) {
    const tracks = trackIds.map(id => MOCK_TRACKS.find(t => t.id === id)).filter(t => t);
    return {
      statusCode: 200,
      body: { tracks }
    };
  }

  async searchTracks(query, options = {}) {
    const lowercaseQuery = query.toLowerCase();
    const results = MOCK_TRACKS.filter(t => 
      t.name.toLowerCase().includes(lowercaseQuery) || 
      t.artists.some(a => a.name.toLowerCase().includes(lowercaseQuery))
    );
    return {
      statusCode: 200,
      body: {
        tracks: {
          items: results.slice(0, options.limit || 20)
        }
      }
    };
  }

  async searchArtists(query, options = {}) {
    const lowercaseQuery = query.toLowerCase();
    const results = MOCK_ARTISTS.filter(a => a.name.toLowerCase().includes(lowercaseQuery));
    return {
      statusCode: 200,
      body: {
        artists: {
          items: results.slice(0, options.limit || 20)
        }
      }
    };
  }

  async getArtist(artistId) {
    const artist = MOCK_ARTISTS.find(a => a.id === artistId);
    if (!artist) throw { statusCode: 404, message: 'Artist not found' };
    return {
      statusCode: 200,
      body: artist
    };
  }

  async getArtistTopTracks(artistId, country) {
    const artist = MOCK_ARTISTS.find(a => a.id === artistId);
    if (!artist) throw { statusCode: 404, message: 'Artist not found' };
    return {
      statusCode: 200,
      body: {
        tracks: artist.topTracks
      }
    };
  }

  async getArtistAlbums(artistId, options = {}) {
    const artist = MOCK_ARTISTS.find(a => a.id === artistId);
    if (!artist) throw { statusCode: 404, message: 'Artist not found' };
    return {
      statusCode: 200,
      body: {
        items: artist.albums.slice(options.offset || 0, (options.offset || 0) + (options.limit || 10))
      }
    };
  }
}

module.exports = SpotifyWebApiMock;
module.exports.MOCK_TRACKS = MOCK_TRACKS;
module.exports.MOCK_PLAYLISTS = MOCK_PLAYLISTS;
module.exports.MOCK_ARTISTS = MOCK_ARTISTS;
module.exports.MOCK_CATEGORIES = MOCK_CATEGORIES;
