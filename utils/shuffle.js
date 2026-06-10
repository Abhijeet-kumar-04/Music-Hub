/**
 * Fisher-Yates shuffle algorithm.
 * @param {Array} array
 * @returns {Array} Shuffled copy of the array
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Filter duplicates by track name (case-insensitive, normalized) and choose a diverse mix.
 * @param {Array} tracks
 * @param {number} limit
 * @returns {Array} Diverse, unique tracks
 */
function getDiverseTracks(tracks, limit = 6) {
  const seenNames = new Set();
  const uniqueTracks = [];

  for (const track of tracks) {
    if (!track) continue;
    // Normalize name to filter duplicates like "Kesariya", "Kesariya (Lofi)", etc.
    const cleanName = track.name
      .toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, '') // remove parenthetical info like (From "Brahmastra")
      .replace(/\s*-\s*.*$/g, '') // remove trailing hyphens
      .trim();

    if (!seenNames.has(cleanName)) {
      seenNames.add(cleanName);
      uniqueTracks.push(track);
    }
  }

  return shuffle(uniqueTracks).slice(0, limit);
}

module.exports = {
  shuffle,
  getDiverseTracks
};
