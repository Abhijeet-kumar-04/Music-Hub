function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDiverseTracks(tracks, limit = 6) {
  const seenNames = new Set();
  const uniqueTracks = [];

  for (const track of tracks) {
    if (!track) continue;
    const cleanName = track.name
      .toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*-\s*.*$/g, '')
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
