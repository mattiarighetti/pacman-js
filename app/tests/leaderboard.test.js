const assert = require('assert');
const Leaderboard = require('../scripts/utilities/leaderboard');

let storage;

beforeEach(() => {
  storage = {};
  global.localStorage = {
    getItem: (key) => storage[key],
    setItem: (key, value) => {
      storage[key] = value;
    },
  };
});

describe('leaderboard', () => {
  describe('load', () => {
    it('returns stored entries', () => {
      const entries = [{
        initials: 'NEX',
        score: 100,
        shield: 'pos',
        settlements: 1,
      }];
      storage[Leaderboard.STORAGE_KEY] = JSON.stringify(entries);

      assert.deepEqual(Leaderboard.load(), entries);
    });

    it('returns an empty list for valid JSON that is not an array', () => {
      storage[Leaderboard.STORAGE_KEY] = JSON.stringify({ score: 100 });

      assert.deepEqual(Leaderboard.load(), []);
    });

    it('returns an empty list for invalid stored JSON', () => {
      storage[Leaderboard.STORAGE_KEY] = 'not-json';

      assert.deepEqual(Leaderboard.load(), []);
    });

    it('migrates a legacy high score when the ranking is empty', () => {
      storage[Leaderboard.LEGACY_HIGH_SCORE_KEY] = '900';

      assert.deepEqual(Leaderboard.load(), [{
        initials: 'YOU',
        score: 900,
        shield: 'contactless',
        settlements: 0,
      }]);
    });

    it('ignores non numeric legacy high scores', () => {
      storage[Leaderboard.LEGACY_HIGH_SCORE_KEY] = 'DECLINED';

      assert.deepEqual(Leaderboard.load(), []);
    });
  });

  describe('save', () => {
    it('persists entries and the best score', () => {
      const entries = [
        { initials: 'AAA', score: 100 },
        { initials: 'BBB', score: 300 },
      ];

      Leaderboard.save(entries);

      assert.strictEqual(storage[Leaderboard.STORAGE_KEY], JSON.stringify(entries));
      assert.strictEqual(storage[Leaderboard.HIGH_SCORE_KEY], '300');
    });

    it('does not write the high score when there are no entries', () => {
      Leaderboard.save([]);

      assert.strictEqual(storage[Leaderboard.STORAGE_KEY], '[]');
      assert.strictEqual(storage[Leaderboard.HIGH_SCORE_KEY], undefined);
    });
  });

  describe('qualifies', () => {
    it('requires a positive score when the ranking has free slots', () => {
      assert.strictEqual(Leaderboard.qualifies(0), false);
      assert.strictEqual(Leaderboard.qualifies(1), true);
    });

    it('requires beating the lowest score when the ranking is full', () => {
      storage[Leaderboard.STORAGE_KEY] = JSON.stringify([
        { score: 500 },
        { score: 400 },
        { score: 300 },
        { score: 200 },
        { score: 100 },
      ]);

      assert.strictEqual(Leaderboard.qualifies(100), false);
      assert.strictEqual(Leaderboard.qualifies(101), true);
    });
  });

  describe('insert', () => {
    it('adds defaults, sorts by score, trims, and saves', () => {
      storage[Leaderboard.STORAGE_KEY] = JSON.stringify([
        {
          initials: 'AAA',
          score: 500,
          shield: 'pos',
          settlements: 1,
        },
        {
          initials: 'BBB',
          score: 400,
          shield: 'wallet',
          settlements: 2,
        },
        {
          initials: 'CCC',
          score: 300,
          shield: 'qr',
          settlements: 3,
        },
        {
          initials: 'DDD',
          score: 200,
          shield: 'token',
          settlements: 4,
        },
        {
          initials: 'EEE',
          score: 100,
          shield: 'contactless',
          settlements: 5,
        },
      ]);

      const result = Leaderboard.insert({ score: 450 });

      assert.strictEqual(result.length, Leaderboard.MAX_ENTRIES);
      assert.deepEqual(result.map((entry) => entry.score), [500, 450, 400, 300, 200]);
      assert.deepEqual(result[1], {
        initials: 'YOU',
        score: 450,
        shield: 'contactless',
        settlements: 0,
      });
      assert.strictEqual(JSON.parse(storage[Leaderboard.STORAGE_KEY]).length, Leaderboard.MAX_ENTRIES);
    });

    it('keeps provided entry details and normalizes numeric values', () => {
      const result = Leaderboard.insert({
        initials: 'POS',
        score: '0',
        shield: 'token',
        settlements: '2',
      });

      assert.deepEqual(result[0], {
        initials: 'POS',
        score: 0,
        shield: 'token',
        settlements: 2,
      });
    });
  });

  describe('bestScore', () => {
    it('returns zero when the ranking is empty', () => {
      assert.strictEqual(Leaderboard.bestScore(), 0);
    });

    it('returns the first stored score', () => {
      storage[Leaderboard.STORAGE_KEY] = JSON.stringify([{ score: 700 }]);

      assert.strictEqual(Leaderboard.bestScore(), 700);
    });
  });
});
