const assert = require('assert');
const sinon = require('sinon');
const FirebaseLeaderboard = require('../scripts/utilities/firebaseLeaderboard');

function createFirebase(options = {}) {
  const docs = options.docs || [];
  const add = sinon.stub().resolves({ id: 'entry-1' });
  const get = sinon.stub().resolves({
    forEach: (callback) => {
      docs.forEach((doc) => {
        callback({ data: () => doc });
      });
    },
  });
  const limit = sinon.stub().returns({ get });
  const orderBy = sinon.stub().returns({ limit });
  const collectionApi = { add, orderBy };
  const collection = sinon.stub().returns(collectionApi);
  const firestore = sinon.stub().returns({ collection });

  if (options.withTimestamp !== false) {
    firestore.FieldValue = {
      serverTimestamp: sinon.stub().returns('server-time'),
    };
  }

  const firebase = {
    apps: options.apps,
    initializeApp: sinon.stub(),
    firestore,
    calls: {
      add,
      collection,
      get,
      limit,
      orderBy,
    },
  };

  if (options.withInitialize === false) {
    delete firebase.initializeApp;
  }

  if (options.withFirestore === false) {
    delete firebase.firestore;
  }

  return firebase;
}

describe('firebaseLeaderboard', () => {
  let clock;

  beforeEach(() => {
    delete global.window;
    clock = sinon.useFakeTimers(new Date('2026-01-02T03:04:05.000Z').getTime());
  });

  afterEach(() => {
    clock.restore();
    delete global.window;
  });

  it('attaches itself to window when loaded in a browser-like context', () => {
    delete require.cache[require.resolve('../scripts/utilities/firebaseLeaderboard')];
    global.window = {};

    // eslint-disable-next-line global-require
    const BrowserFirebaseLeaderboard = require('../scripts/utilities/firebaseLeaderboard');

    assert.strictEqual(global.window.FirebaseLeaderboard, BrowserFirebaseLeaderboard);
  });

  it('reports unavailable without a browser firebase object', async () => {
    assert.strictEqual(FirebaseLeaderboard.getFirebase(), null);
    assert.strictEqual(FirebaseLeaderboard.initialize(), null);
    assert.strictEqual(FirebaseLeaderboard.getFirestore(), null);
    assert.strictEqual(FirebaseLeaderboard.isAvailable(), false);
    assert.strictEqual(await FirebaseLeaderboard.saveGame({ score: 100 }), false);
    assert.deepStrictEqual(await FirebaseLeaderboard.loadTop(), []);

    global.window = {};
    assert.strictEqual(FirebaseLeaderboard.getFirebase(), null);
  });

  it('reports unavailable when required firebase methods are missing', () => {
    global.window = {
      firebase: createFirebase({ withFirestore: false }),
    };
    assert.strictEqual(FirebaseLeaderboard.initialize(), null);

    global.window = {
      firebase: createFirebase({ withInitialize: false }),
    };
    assert.strictEqual(FirebaseLeaderboard.initialize(), null);
  });

  it('initializes firebase and saves valid game entries', async () => {
    const firebase = createFirebase({ apps: [] });
    global.window = { firebase };

    const saved = await FirebaseLeaderboard.saveGame({
      name: '  Team    Nexi    VeryVeryLongName  ',
      score: '500',
      date: '2026-02-03T04:05:06.000Z',
    });

    assert.strictEqual(saved, true);
    assert(firebase.initializeApp.calledOnceWith(FirebaseLeaderboard.CONFIG));
    assert(firebase.calls.collection.calledOnceWith(FirebaseLeaderboard.COLLECTION_NAME));
    assert(firebase.calls.add.calledOnce);
    assert.deepStrictEqual(firebase.calls.add.firstCall.firstArg, {
      name: 'Team Nexi VeryVeryLo',
      score: 500,
      date: '2026-02-03T04:05:06.000Z',
      source: FirebaseLeaderboard.SOURCE,
      createdAt: 'server-time',
    });
  });

  it('uses an existing firebase app and falls back when server timestamps are unavailable', async () => {
    const firebase = createFirebase({
      apps: [{}],
      withTimestamp: false,
    });
    global.window = { firebase };

    const saved = await FirebaseLeaderboard.saveGame({
      name: 'Nexi Dev',
      score: 10,
      date: 'invalid-date',
    });

    assert.strictEqual(saved, true);
    assert(!firebase.initializeApp.called);
    assert.strictEqual(firebase.calls.add.firstCall.firstArg.createdAt, '2026-01-02T03:04:05.000Z');
  });

  it('initializes firebase when the app registry is missing', () => {
    const firebase = createFirebase();
    delete firebase.apps;
    global.window = { firebase };

    assert.strictEqual(FirebaseLeaderboard.isAvailable(), true);
    assert(firebase.initializeApp.calledOnceWith(FirebaseLeaderboard.CONFIG));
  });

  it('does not save scores that are zero or lower', async () => {
    const firebase = createFirebase({ apps: [] });
    global.window = { firebase };

    assert.strictEqual(await FirebaseLeaderboard.saveGame({ score: 0 }), false);
    assert(!firebase.calls.add.called);
  });

  it('returns false when firestore rejects a save', async () => {
    const firebase = createFirebase({ apps: [] });
    firebase.calls.add.rejects(new Error('permission denied'));
    global.window = { firebase };

    assert.strictEqual(await FirebaseLeaderboard.saveGame({ score: 10 }), false);
  });

  it('loads and normalizes the remote top leaderboard', async () => {
    const firebase = createFirebase({
      apps: [],
      docs: [
        {
          name: 'Remote Hero',
          score: '3000',
          date: '2026-03-04T05:06:07.000Z',
          source: 'remote-test',
        },
        {
          name: '',
          score: -1,
          date: '',
        },
      ],
    });
    global.window = { firebase };

    const entries = await FirebaseLeaderboard.loadTop(5);

    assert(firebase.calls.orderBy.calledOnceWith('score', 'desc'));
    assert(firebase.calls.limit.calledOnceWith(5));
    assert(firebase.calls.get.calledOnce);
    assert.deepStrictEqual(entries, [
      {
        name: 'Remote Hero',
        score: 3000,
        date: '2026-03-04T05:06:07.000Z',
        source: 'remote-test',
      },
      {
        name: FirebaseLeaderboard.DEFAULT_PLAYER_NAME,
        score: 0,
        date: '2026-01-02T03:04:05.000Z',
        source: FirebaseLeaderboard.SOURCE,
      },
    ]);
  });

  it('normalizes invalid scores, dates, and empty entries', () => {
    assert.strictEqual(FirebaseLeaderboard.normalizeScore('Infinity'), 0);
    assert.strictEqual(FirebaseLeaderboard.normalizeScore(-5), 0);
    assert.deepStrictEqual(FirebaseLeaderboard.normalizeEntry(), {
      name: FirebaseLeaderboard.DEFAULT_PLAYER_NAME,
      score: 0,
      date: '2026-01-02T03:04:05.000Z',
      source: FirebaseLeaderboard.SOURCE,
    });
  });
});
