const axios = require('axios');
const CryptoJS = require('crypto-js');

const DECRYPTION_KEY = '38346591';

function decryptUrl(encryptedUrl) {
  if (!encryptedUrl) return '';
  try {
    const keyHex = CryptoJS.enc.Utf8.parse(DECRYPTION_KEY);
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
      keyHex,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    let decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (decryptedText) {
      if (decryptedText.endsWith('_96.mp4')) {
        decryptedText = decryptedText.replace('_96.mp4', '_320.mp4');
      } else if (decryptedText.endsWith('_96.m4a')) {
        decryptedText = decryptedText.replace('_96.m4a', '_320.m4a');
      }
    }
    return decryptedText;
  } catch (err) {
    console.error('Error decrypting URL:', err.message);
    return '';
  }
}

async function searchSongs(query, page = 1, limit = 20) {
  if (!query) return [];
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&p=${page}&n=${limit}&q=${encodeURIComponent(query)}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });

    if (!res.data || !res.data.results) {
      return [];
    }

    return res.data.results.map(song => {
      let coverUrl = song.image || '';
      if (coverUrl.includes('-150x150.jpg')) {
        coverUrl = coverUrl.replace('-150x150.jpg', '-500x500.jpg');
      } else if (coverUrl.includes('-150x150.png')) {
        coverUrl = coverUrl.replace('-150x150.png', '-500x500.png');
      }

      const artistNames = (song.singers || song.primary_artists || 'Unknown Artist')
        .split(',')
        .map(name => name.trim());
      const artists = artistNames.map(name => ({ name }));

      const decryptedAudioUrl = decryptUrl(song.encrypted_media_url);

      return {
        id: song.id,
        name: song.song || song.title || 'Unknown Track',
        artists: artists,
        album: {
          name: song.album || 'Single',
          images: [
            { url: coverUrl },
            { url: coverUrl },
            { url: coverUrl }
          ]
        },
        duration_ms: parseInt(song.duration || '0') * 1000,
        isLocal: false,
        audioUrl: decryptedAudioUrl || song.media_preview_url || song.vlink || ''
      };
    });
  } catch (err) {
    console.error('JioSaavn searchSongs failed:', err.message);
    return [];
  }
}

async function getSongById(id) {
  if (!id) return null;
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_format=json&pids=${id}`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });

    if (res.data && res.data[id]) {
      const song = res.data[id];
      let coverUrl = song.image || '';
      if (coverUrl.includes('-150x150.jpg')) {
        coverUrl = coverUrl.replace('-150x150.jpg', '-500x500.jpg');
      } else if (coverUrl.includes('-150x150.png')) {
        coverUrl = coverUrl.replace('-150x150.png', '-500x500.png');
      }

      const artistNames = (song.singers || song.primary_artists || 'Unknown Artist')
        .split(',')
        .map(name => name.trim());
      const artists = artistNames.map(name => ({ name }));

      const decryptedAudioUrl = decryptUrl(song.encrypted_media_url);

      return {
        id: song.id,
        name: song.song || song.title || 'Unknown Track',
        artists: artists,
        album: {
          name: song.album || 'Single',
          images: [
            { url: coverUrl },
            { url: coverUrl },
            { url: coverUrl }
          ]
        },
        duration_ms: parseInt(song.duration || '0') * 1000,
        isLocal: false,
        audioUrl: decryptedAudioUrl || song.media_preview_url || song.vlink || ''
      };
    }
  } catch (err) {
    console.error('JioSaavn getSongById failed:', err.message);
  }
  return null;
}

module.exports = {
  searchSongs,
  getSongById,
  decryptUrl
};
