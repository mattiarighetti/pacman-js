const assert = require('assert');
const sinon = require('sinon');
const Timer = require('../scripts/utilities/timer');

let comp;
let clock;

const findDispatchedEvent = (type) => window.dispatchEvent
  .getCalls()
  .map((call) => call.args[0])
  .find((event) => event.type === type);

describe('timer', () => {
  beforeEach(() => {
    global.window = global.window || {};
    global.CustomEvent = class {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
    window.setTimeout = () => { };
    window.dispatchEvent = () => { };
    clock = sinon.useFakeTimers();

    comp = new Timer(undefined, 1000);
  });

  afterEach(() => {
    clock.restore();
  });

  describe('pause', () => {
    beforeEach(() => {
      window.clearTimeout = sinon.fake();
    });

    it('clears the timeout and adjusts remaining time', () => {
      comp.timerId = 2;
      comp.start = new Date();
      clock.tick(500);

      comp.pause();
      assert(window.clearTimeout.calledWith(comp.timerId));
      assert.strictEqual(comp.remaining, 500);
    });

    it('sets a flag when paused by the system', () => {
      comp.pause(true);
      assert(comp.pausedBySystem);
    });
  });

  describe('resume', () => {
    it('executes the callback on a delay and dispatches events', () => {
      window.setTimeout = setTimeout;
      comp.callback = sinon.fake();
      window.dispatchEvent = sinon.fake();

      comp.resume();
      assert.strictEqual(comp.pausedBySystem, false);
      assert.deepEqual(comp.start, new Date());
      assert(!comp.callback.called);
      assert.strictEqual(findDispatchedEvent('addTimer').detail.timer, comp);

      clock.tick(1000);
      assert(comp.callback.called);
      assert.strictEqual(findDispatchedEvent('removeTimer').detail.timer, comp);
    });

    it('ignores players resuming timers paused by the system', () => {
      comp.pausedBySystem = true;
      window.setTimeout = sinon.fake();

      comp.resume();
      assert(!window.setTimeout.called);
    });

    it('only dispatches the addTimer event once', () => {
      comp.oldTimerId = 1;
      window.dispatchEvent = sinon.fake();

      comp.resume();
      assert(!window.dispatchEvent.called);
    });
  });
});
