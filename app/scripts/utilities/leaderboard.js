/**
 * Local-only leaderboard for the Nexi Pac-Man hackathon edition.
 * Persists a top-5 ranking to localStorage. No network calls.
 */
class Leaderboard {
  static get STORAGE_KEY() {
    return 'nexi:leaderboard';
  }

  static get LEGACY_HIGH_SCORE_KEY() {
    return 'highScore';
  }

  static get HIGH_SCORE_KEY() {
    return 'nexi:highScore';
  }

  static get MAX_ENTRIES() {
    return 5;
  }

  /**
   * Loads the stored ranking. Falls back to an empty list and migrates the
   * legacy highScore key when present so existing players keep their record.
   * @returns {Array<{initials:string, score:number, shield:string, settlements:number}>}
   */
  static load() {
    let entries = [];
    try {
      const raw = localStorage.getItem(Leaderboard.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          entries = parsed;
        }
      }
    } catch (e) {
      entries = [];
    }

    if (entries.length === 0) {
      const legacy = localStorage.getItem(Leaderboard.LEGACY_HIGH_SCORE_KEY);
      if (legacy && !Number.isNaN(Number(legacy))) {
        entries = [{
          initials: 'YOU',
          score: Number(legacy),
          shield: 'contactless',
          settlements: 0,
        }];
      }
    }

    return entries;
  }

  /**
   * Persists the ranking back to localStorage.
   * @param {Array} entries
   */
  static save(entries) {
    localStorage.setItem(Leaderboard.STORAGE_KEY, JSON.stringify(entries));
    if (entries.length > 0) {
      const top = entries.reduce((best, current) => (
        current.score > best.score ? current : best
      ), entries[0]);
      localStorage.setItem(Leaderboard.HIGH_SCORE_KEY, String(top.score));
    }
  }

  /**
   * Returns true when the given score would enter the local top 5.
   * @param {number} score
   * @returns {boolean}
   */
  static qualifies(score) {
    const entries = Leaderboard.load();
    if (entries.length < Leaderboard.MAX_ENTRIES) {
      return score > 0;
    }
    const lowest = entries.reduce((min, current) => (
      current.score < min ? current.score : min
    ), entries[0].score);
    return score > lowest;
  }

  /**
   * Inserts a new entry, sorts, and truncates to the maximum size.
   * @param {{initials:string, score:number, shield:string, settlements:number}} entry
   * @returns {Array}
   */
  static insert(entry) {
    const entries = Leaderboard.load();
    entries.push({
      initials: entry.initials || 'YOU',
      score: Number(entry.score) || 0,
      shield: entry.shield || 'contactless',
      settlements: Number(entry.settlements) || 0,
    });
    entries.sort((a, b) => b.score - a.score);
    const trimmed = entries.slice(0, Leaderboard.MAX_ENTRIES);
    Leaderboard.save(trimmed);
    return trimmed;
  }

  /**
   * Reads the highest stored score, or 0 when the storage is empty.
   * @returns {number}
   */
  static bestScore() {
    const entries = Leaderboard.load();
    if (entries.length === 0) {
      return 0;
    }
    return entries[0].score;
  }
}

// removeIf(production)
module.exports = Leaderboard;
// endRemoveIf(production)
