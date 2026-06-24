/**
 * Utility helpers used by GameCoordinator to brand UI labels and pop-up
 * texts without leaking markup across the codebase.
 */
class NexiTheme {
  static get TEXTS() {
    return {
      ready: 'AUTHORIZE',
      gameOver: 'DECLINED',
      insertCoin: '1 CREDIT',
      paused: 'SESSION PAUSED',
      oneUp: '1UP',
      highScore: 'ioSi POINTS',
      shieldLabels: {
        contactless: 'CONTACTLESS',
        antifraud: 'ANTI-FRAUD',
        pos: 'POS',
        wallet: 'WALLET',
        qr: 'QR-PAY',
        token: 'TOKEN',
      },
    };
  }

  /**
   * Returns a friendly shield label used in the HUD and leaderboard.
   * @param {string} shield
   * @returns {string}
   */
  static shieldLabel(shield) {
    return NexiTheme.TEXTS.shieldLabels[shield] || 'CONTACTLESS';
  }

  /**
   * Maps a fruit point value to the Nexi shield chip name. Falls back to the
   * raw point value when the point table does not match.
   * @param {number} points
   * @returns {string}
   */
  static shieldForPoints(points) {
    if (points >= 5000) {
      return 'token';
    }
    if (points >= 2000) {
      return 'qr';
    }
    if (points >= 700) {
      return 'wallet';
    }
    if (points >= 300) {
      return 'pos';
    }
    return 'contactless';
  }

  /**
   * Returns a CSS class for a given shield chip.
   * @param {string} shield
   * @returns {string}
   */
  static shieldChipClass(shield) {
    return `fruit-chip ${shield}`;
  }
}

// removeIf(production)
module.exports = NexiTheme;
// endRemoveIf(production)
