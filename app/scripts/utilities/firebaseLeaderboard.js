class FirebaseLeaderboard {
  static get COLLECTION_NAME() {
    return 'leaderboards';
  }

  static get CONFIG() {
    return {
      apiKey: 'AIzaSyBAz_j5kPjSqKrWSyouFST6ikR8UqBf2qo',
      authDomain: 'pay-man-nexidigital.firebaseapp.com',
      projectId: 'pay-man-nexidigital',
      storageBucket: 'pay-man-nexidigital.firebasestorage.app',
      messagingSenderId: '406474888254',
      appId: '1:406474888254:web:b755ec639a4889017d6d6f',
    };
  }

  static get DEFAULT_LIMIT() {
    return 20;
  }

  static get DEFAULT_PLAYER_NAME() {
    return 'Player Nexi';
  }

  static get NAME_LIMIT() {
    return 20;
  }

  static get SOURCE() {
    return 'pay-man';
  }

  static getFirebase() {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.firebase || null;
  }

  static initialize() {
    const firebase = FirebaseLeaderboard.getFirebase();
    if (!firebase) {
      return null;
    }

    if (typeof firebase.initializeApp !== 'function') {
      return null;
    }

    if (typeof firebase.firestore !== 'function') {
      return null;
    }

    if (!Array.isArray(firebase.apps) || firebase.apps.length === 0) {
      firebase.initializeApp(FirebaseLeaderboard.CONFIG);
    }

    return firebase;
  }

  static getFirestore() {
    const firebase = FirebaseLeaderboard.initialize();
    if (!firebase) {
      return null;
    }

    return firebase.firestore();
  }

  static isAvailable() {
    return Boolean(FirebaseLeaderboard.getFirestore());
  }

  static createDiagnostic(operation, error) {
    return {
      operation,
      collection: FirebaseLeaderboard.COLLECTION_NAME,
      code: error && error.code ? error.code : 'unknown',
      message: error && error.message ? error.message : String(error || 'Unknown Firebase error'),
    };
  }

  static reportDiagnostic(operation, error) {
    const diagnostic = FirebaseLeaderboard.createDiagnostic(operation, error);
    if (typeof window !== 'undefined') {
      window.firebaseLeaderboardLastError = diagnostic;
    }

    // eslint-disable-next-line no-console
    console.warn('Firebase leaderboard error', diagnostic);
    return diagnostic;
  }

  static sanitizeName(rawName) {
    const normalized = String(rawName || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return FirebaseLeaderboard.DEFAULT_PLAYER_NAME;
    }

    return normalized.slice(0, FirebaseLeaderboard.NAME_LIMIT);
  }

  static normalizeScore(rawScore) {
    const score = Number(rawScore);
    if (!Number.isFinite(score) || score < 0) {
      return 0;
    }

    return score;
  }

  static normalizeDate(rawDate) {
    const date = new Date(rawDate);
    if (!rawDate || Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return date.toISOString();
  }

  static normalizeEntry(rawEntry = {}) {
    return {
      name: FirebaseLeaderboard.sanitizeName(rawEntry.name),
      score: FirebaseLeaderboard.normalizeScore(rawEntry.score),
      date: FirebaseLeaderboard.normalizeDate(rawEntry.date),
      source: rawEntry.source || FirebaseLeaderboard.SOURCE,
    };
  }

  static buildSavePayload(entry, firebase) {
    const payload = FirebaseLeaderboard.normalizeEntry(entry);
    const fieldValue = firebase.firestore.FieldValue;
    if (fieldValue && typeof fieldValue.serverTimestamp === 'function') {
      payload.createdAt = fieldValue.serverTimestamp();
    } else {
      payload.createdAt = payload.date;
    }

    return payload;
  }

  static saveGame(entry) {
    const firebase = FirebaseLeaderboard.initialize();
    if (!firebase) {
      FirebaseLeaderboard.reportDiagnostic('saveGame', new Error('Firebase SDK is unavailable'));
      return Promise.resolve(false);
    }

    const payload = FirebaseLeaderboard.buildSavePayload(entry, firebase);
    if (payload.score <= 0) {
      return Promise.resolve(false);
    }

    return firebase.firestore()
      .collection(FirebaseLeaderboard.COLLECTION_NAME)
      .add(payload)
      .then(() => true)
      .catch((error) => {
        FirebaseLeaderboard.reportDiagnostic('saveGame', error);
        return false;
      });
  }

  static loadTop(limit = FirebaseLeaderboard.DEFAULT_LIMIT) {
    const db = FirebaseLeaderboard.getFirestore();
    if (!db) {
      FirebaseLeaderboard.reportDiagnostic('loadTop', new Error('Firebase SDK is unavailable'));
      return Promise.resolve([]);
    }

    return db
      .collection(FirebaseLeaderboard.COLLECTION_NAME)
      .orderBy('score', 'desc')
      .limit(limit)
      .get()
      .then((snapshot) => {
        const entries = [];
        snapshot.forEach((doc) => {
          entries.push(FirebaseLeaderboard.normalizeEntry(doc.data()));
        });
        return entries;
      })
      .catch((error) => {
        FirebaseLeaderboard.reportDiagnostic('loadTop', error);
        throw error;
      });
  }
}

if (typeof window !== 'undefined') {
  window.FirebaseLeaderboard = FirebaseLeaderboard;
}

// removeIf(production)
/* istanbul ignore next */
if (typeof module !== 'undefined') {
  module.exports = FirebaseLeaderboard;
}
// endRemoveIf(production)
