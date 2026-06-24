const assert = require('assert');
const NexiTheme = require('../scripts/utilities/nexiTheme');

describe('nexiTheme', () => {
  it('exposes arcade payment labels', () => {
    assert.strictEqual(NexiTheme.TEXTS.ready, 'AUTHORIZE');
    assert.strictEqual(NexiTheme.TEXTS.gameOver, 'DECLINED');
    assert.strictEqual(NexiTheme.TEXTS.highScore, 'ioSi POINTS');
  });

  it('returns shield labels with a contactless fallback', () => {
    assert.strictEqual(NexiTheme.shieldLabel('pos'), 'POS');
    assert.strictEqual(NexiTheme.shieldLabel('unknown'), 'CONTACTLESS');
  });

  it('maps point values to shield types', () => {
    assert.strictEqual(NexiTheme.shieldForPoints(5000), 'token');
    assert.strictEqual(NexiTheme.shieldForPoints(2000), 'qr');
    assert.strictEqual(NexiTheme.shieldForPoints(700), 'wallet');
    assert.strictEqual(NexiTheme.shieldForPoints(300), 'pos');
    assert.strictEqual(NexiTheme.shieldForPoints(100), 'contactless');
  });

  it('builds shield chip CSS classes', () => {
    assert.strictEqual(NexiTheme.shieldChipClass('wallet'), 'fruit-chip wallet');
  });
});
