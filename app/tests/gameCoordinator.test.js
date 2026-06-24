const assert = require('assert');
const sinon = require('sinon');
const GameCoordinator = require('../scripts/core/gameCoordinator');

let comp;
const mazeArray = [
  ['X', 'X', 'X'],
  ['X', 'o', 'O'],
  ['X', ' ', 'X'],
];
let clock;

describe('gameCoordinator', () => {
  beforeEach(() => {
    global.Pacman = class {
      activateContactlessMode() {}

      deactivateContactlessMode() {}

      reset() {}
    };
    global.CharacterUtil = class {};
    global.Ghost = class {
      reset() {}

      changeMode() {}

      endIdleMode() {}

      pause() {}
    };
    global.Pickup = class {
      constructor(type) {
        this.type = type;
      }

      hideContactless() {}

      hideOtp() {}

      reset() {}

      showContactless() {}

      showOtp() {}
    };
    global.Timer = class {
      constructor(callback, delay) {
        setTimeout(callback, delay);
      }
    };
    global.GameEngine = class {
      start() {}
    };

    global.SoundManager = class {
      setCutscene() {}

      setMasterVolume() {}

      play() {}

      setAmbience() {}

      playDotSound() {}

      resumeAmbience() {}

      stopAmbience() {}
    };

    global.document = {
      documentElement: {
        clientHeight: 1000,
        clientWidth: 1000,
      },
      getElementsByTagName: () => [{ appendChild: () => {} }],
      getElementById: () => ({
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        remove: () => {},
        style: {},
        scrollWidth: 500,
      }),
      createElement: () => ({
        classList: {
          add: () => {},
        },
        appendChild: () => {},
        setAttribute: () => {},
        style: {},
      }),
    };

    global.localStorage = {
      getItem: () => {},
      setItem: () => {},
    };

    global.Image = class {
      set src(value) {
        // Trigger onload callback immediately
        if (this.onload) {
          this.onload();
        }
      }
    };

    global.Audio = class {
      constructor() {
        this.eventListeners = {};
      }

      addEventListener(event, callback) {
        if (event === 'canplaythrough') {
          // Trigger the callback immediately
          if (callback) {
            callback();
          }
        }
      }

      load() {
        // Trigger canplaythrough event after load
        const callback = this.eventListeners.canplaythrough;
        if (callback) {
          callback();
        }
      }

      set src(value) {
        // When src is set, trigger canplaythrough
        const callback = this.eventListeners.canplaythrough;
        if (callback) {
          callback();
        }
      }

      onerror() {}
    };

    clock = sinon.useFakeTimers();
    comp = new GameCoordinator();
    comp.mazeDiv.style = {};
    comp.gameUi.style = {};
    comp.reset();
  });

  afterEach(() => {
    clock.restore();
  });

  describe('determineScale', () => {
    it('recursively calls itself to find the biggest possible scale', () => {
      sinon.spy(comp, 'determineScale');
      global.window.innerHeight = 1000;
      global.window.innerWidth = 1000;

      const result = comp.determineScale(1);
      assert.strictEqual(result, 3);
      assert.strictEqual(comp.determineScale.callCount, 4);
    });
  });

  describe('constructor', () => {
    it('registers pause menu button click listeners', () => {
      const originalGetElementById = global.document.getElementById;
      const defaultElement = () => ({
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        remove: () => {},
        style: {},
        scrollWidth: 500,
      });
      const resumeGameButton = {
        addEventListener: sinon.fake(),
      };
      const restartGameButton = {
        addEventListener: sinon.fake(),
      };
      global.document.getElementById = (id) => {
        if (id === 'resume-game') {
          return resumeGameButton;
        }

        if (id === 'restart-game') {
          return restartGameButton;
        }

        return defaultElement();
      };

      const newComp = new GameCoordinator();
      assert(resumeGameButton.addEventListener.calledWith('click'));
      assert(restartGameButton.addEventListener.calledWith('click'));
      assert.strictEqual(typeof newComp.resumeGameButton.addEventListener, 'function');
      assert.strictEqual(typeof newComp.restartGameButton.addEventListener, 'function');

      global.document.getElementById = originalGetElementById;
    });

    it('handles pages without a player name input', () => {
      const originalGetElementById = global.document.getElementById;
      global.document.getElementById = (id) => (
        id === 'player-name-input'
          ? null
          : originalGetElementById(id)
      );

      const instance = new GameCoordinator();
      assert.strictEqual(instance.playerNameInput, null);

      global.document.getElementById = originalGetElementById;
    });
  });

  describe('startButtonClick', () => {
    it('calls init on firstGame', () => {
      comp.init = sinon.fake();
      comp.firstGame = false;
      comp.playerNameInput = { value: 'Team Nexi' };
      global.localStorage.setItem = sinon.fake();

      comp.startButtonClick();
      assert(!comp.init.called);
      assert.strictEqual(comp.leftCover.style.left, '-50%');
      assert.strictEqual(comp.rightCover.style.right, '-50%');
      assert.strictEqual(comp.mainMenu.style.opacity, 0);
      assert.strictEqual(comp.gameStartButton.disabled, true);
      assert(global.localStorage.setItem.calledWith('pacmanNexiCurrentPlayer', 'Team Nexi'));

      clock.tick(1000);
      assert.strictEqual(comp.mainMenu.style.visibility, 'hidden');

      comp.firstGame = true;

      comp.startButtonClick();
      assert(comp.init.called);
      assert(!comp.firstGame);
    });
  });

  describe('resumeGameClick', () => {
    beforeEach(() => {
      comp.activeTimers = [{ resume: sinon.fake() }];
      comp.reset = sinon.fake();
      comp.startGameplay = sinon.fake();
      comp.soundManager.resumeAmbience = sinon.fake();
      comp.gameUi.style.filter = 'blur(5px)';
      comp.pausedText.style.visibility = 'visible';
      comp.pauseButton.innerHTML = 'play_arrow';
    });

    it('does nothing before the game engine exists', () => {
      comp.gameEngine = undefined;

      comp.resumeGameClick();
      assert(!comp.reset.called);
      assert(!comp.startGameplay.called);
      assert(!comp.soundManager.resumeAmbience.called);
    });

    it('does nothing if the game is already running', () => {
      comp.gameEngine = {
        start: sinon.fake(),
        started: true,
      };

      comp.resumeGameClick();
      assert(!comp.gameEngine.start.called);
      assert(!comp.reset.called);
      assert(!comp.startGameplay.called);
    });

    it('resumes the paused game without resetting it', () => {
      comp.gameEngine = {
        start: sinon.fake(),
        started: false,
      };

      comp.resumeGameClick();
      assert(comp.gameEngine.start.called);
      assert(comp.soundManager.resumeAmbience.called);
      assert.strictEqual(comp.gameUi.style.filter, 'unset');
      assert.strictEqual(comp.pausedText.style.visibility, 'hidden');
      assert.strictEqual(comp.pauseButton.innerHTML, 'pause');
      assert(comp.activeTimers[0].resume.called);
      assert(!comp.reset.called);
      assert(!comp.startGameplay.called);
    });
  });

  describe('restartGameClick', () => {
    beforeEach(() => {
      comp.soundManager.stopAmbience = sinon.fake();
      comp.reset = sinon.fake(() => {
        comp.entityList = ['reset-entity'];
      });
      comp.startGameplay = sinon.fake();
      comp.gameUi.style.filter = 'blur(5px)';
      comp.pausedText.style.visibility = 'visible';
      comp.pauseButton.innerHTML = 'play_arrow';
    });

    it('does nothing before the game engine exists', () => {
      comp.gameEngine = undefined;

      comp.restartGameClick();
      assert(!comp.reset.called);
      assert(!comp.startGameplay.called);
    });

    it('restarts the game from the pause menu', () => {
      comp.gameEngine = {
        entityList: [],
        start: sinon.fake(),
        stop: sinon.fake(),
      };

      comp.restartGameClick();
      assert(comp.gameEngine.stop.called);
      assert(comp.soundManager.stopAmbience.called);
      assert.strictEqual(comp.gameUi.style.filter, 'unset');
      assert.strictEqual(comp.pausedText.style.visibility, 'hidden');
      assert.strictEqual(comp.pauseButton.innerHTML, 'pause');
      assert(comp.reset.called);
      assert.deepEqual(comp.gameEngine.entityList, ['reset-entity']);
      assert(comp.gameEngine.start.called);
      assert(comp.startGameplay.calledWith(true));
    });

    it('restarts even if the engine has no stop method', () => {
      comp.gameEngine = {
        entityList: [],
        start: sinon.fake(),
      };

      comp.restartGameClick();
      assert(comp.gameEngine.start.called);
      assert(comp.startGameplay.calledWith(true));
    });
  });

  describe('soundButtonClick', () => {
    it('calls setMasterVolume and toggles the soundButton icon', () => {
      comp.soundManager.setMasterVolume = sinon.fake();

      comp.soundManager.masterVolume = 1;
      comp.soundButtonClick();
      assert(comp.soundManager.setMasterVolume.calledWith(0));
      assert.strictEqual(comp.soundButton.innerHTML, 'volume_off');

      comp.soundManager.masterVolume = 0;
      comp.soundButtonClick();
      assert(comp.soundManager.setMasterVolume.calledWith(1));
      assert.strictEqual(comp.soundButton.innerHTML, 'volume_up');
    });
  });

  describe('displayErrorMessage', () => {
    it('removes the loading container and reveals the error message', () => {
      const spy = sinon.fake();
      global.document.getElementById = sinon.fake.returns({
        style: {},
        remove: spy,
      });

      comp.displayErrorMessage();
      clock.tick(1500);
      assert(spy.called);
    });
  });

  describe('preloadAssets', () => {
    it('calls createElements for images and audio', () => {
      const spy = sinon.fake();
      global.document.getElementById = sinon.fake.returns({
        style: {},
        scrollWidth: 500,
        remove: spy,
      });
      comp.createElements = sinon.fake.resolves();

      comp.preloadAssets().then(() => {
        assert(comp.createElements.calledTwice);
        clock.tick(1500);
        assert(spy.called);
      });
    });
  });

  describe('createElements', () => {
    it('creates elements given a list of sources', () => {
      const spy = sinon.fake();
      global.document.getElementById = sinon.fake.returns({
        appendChild: spy,
        style: {},
        scrollWidth: 500,
      });
      Object.defineProperties(global.Image.prototype, {
        src: {
          set() {
            this.onload();
          },
        },
      });

      comp.createElements(['src1', 'src2'], 'img', 100, comp).then(() => {
        assert(spy.called);
      });

      comp.createElements(['src'], 'audio', 100, comp).then(() => {
        assert(spy.called);
      });
    });
  });

  describe('reset', () => {
    it('resets gameCoordinator values to their default states', () => {
      global.localStorage.getItem = sinon.fake();
      comp.collisionDetectionLoop = sinon.fake();
      comp.drawMaze = sinon.fake();

      comp.reset();
      assert.deepEqual(comp.activeTimers, []);
      assert.strictEqual(comp.points, 0);
      assert.deepEqual(comp.shownPopMessageMilestones, []);
      assert.strictEqual(comp.level, 1);
      assert.strictEqual(comp.lives, 2);
      assert.strictEqual(comp.extraLifeGiven, false);
      assert.strictEqual(comp.remainingDots, 0);
      assert.strictEqual(comp.allowKeyPresses, true);
      assert.strictEqual(comp.allowPacmanMovement, false);
      assert.strictEqual(comp.allowPause, false);
      assert.strictEqual(comp.cutscene, true);
      assert(global.localStorage.getItem.calledWith('highScore'));
      assert.strictEqual(
        comp.highScore,
        global.localStorage.getItem('highScore'),
      );
      assert.strictEqual(comp.entityList.length, 8);
      assert.strictEqual(comp.ghosts.length, 4);
      assert.deepEqual(comp.scaredGhosts, []);
      assert.strictEqual(comp.eyeGhosts, 0);
      assert(comp.drawMaze.calledWith(comp.mazeArray, comp.entityList));
      assert.strictEqual(comp.pointsDisplay.innerHTML, '00');
      assert.strictEqual(comp.highScoreDisplay.innerHTML, '00');

      clock.tick(500);
      assert(comp.collisionDetectionLoop.called);
    });

    it('does not call drawMaze if firstGame is FALSE', () => {
      comp.firstGame = false;
      comp.drawMaze = sinon.fake();

      comp.reset();
      assert(!comp.drawMaze.called);
    });
  });

  describe('init', () => {
    it('calls necessary setup functions to start the game', () => {
      comp.registerEventListeners = sinon.fake();
      comp.registerTouchListeners = sinon.fake();
      comp.collisionDetectionLoop = sinon.fake();
      global.SoundManager = class {};

      comp.init();
      assert(comp.registerEventListeners.called);
      assert(!comp.collisionDetectionLoop.called);

      clock.tick(500);
      assert(comp.collisionDetectionLoop.called);
    });
  });

  describe('drawMaze', () => {
    it('creates the maze and adds entities for a given maze array', () => {
      const entityList = [];
      comp.mazeDiv.style = {};
      comp.gameUi.style = {};

      comp.drawMaze(mazeArray, entityList);
      assert.strictEqual(
        comp.mazeDiv.style.height,
        `${comp.scaledTileSize * 31}px`,
      );
      assert.strictEqual(
        comp.mazeDiv.style.width,
        `${comp.scaledTileSize * 28}px`,
      );
      assert.strictEqual(
        comp.gameUi.style.width,
        `${comp.scaledTileSize * 28}px`,
      );
      assert.strictEqual(entityList.length, 2);
    });
  });

  describe('collisionDetectionLoop', () => {
    it('calls checkPacmanProximity for each pickup', () => {
      comp.pacman.position = { left: 0, top: 0 };
      comp.pacman.velocityPerMs = 1;
      const spy = sinon.fake();
      comp.pickups = [{ checkPacmanProximity: spy }];

      comp.collisionDetectionLoop();
      assert(spy.called);
    });

    it("does nothing if Pacman's position is undefined", () => {
      comp.pacman.position = undefined;
      comp.collisionDetectionLoop();
    });
  });

  describe('startGameplay', () => {
    it('calls displayText, then kicks off movement', () => {
      comp.displayText = sinon.fake();
      comp.updateExtraLivesDisplay = sinon.fake();
      const ambientSpy = sinon.fake();
      comp.soundManager = {
        setAmbience: ambientSpy,
        setCutscene: sinon.fake(),
      };

      comp.startGameplay();
      assert(
        comp.displayText.calledWith(
          {
            left: comp.scaledTileSize * 11,
            top: comp.scaledTileSize * 16.5,
          },
          'ready',
          2000,
          comp.scaledTileSize * 6,
          comp.scaledTileSize * 2,
        ),
      );
      assert(comp.updateExtraLivesDisplay.called);

      clock.tick(2000);
      assert(comp.allowPacmanMovement);
      assert(comp.pacman.moving);
      assert(
        comp.soundManager.setAmbience.calledWith(
          comp.determineSiren(comp.remainingDots),
        ),
      );
    });

    it('waits longer for the initialStart', () => {
      comp.displayText = sinon.fake();
      comp.updateExtraLivesDisplay = sinon.fake();
      const playSpy = sinon.fake();
      const ambientSpy = sinon.fake();
      comp.soundManager = {
        play: playSpy,
        setAmbience: ambientSpy,
        setCutscene: sinon.fake(),
      };

      comp.startGameplay(true);
      assert(playSpy.calledWith('game_start'));
      assert(
        comp.displayText.calledWith(
          {
            left: comp.scaledTileSize * 11,
            top: comp.scaledTileSize * 16.5,
          },
          'ready',
          4500,
          comp.scaledTileSize * 6,
          comp.scaledTileSize * 2,
        ),
      );
      assert(comp.updateExtraLivesDisplay.called);

      clock.tick(4500);
      assert(comp.allowPacmanMovement);
      assert(comp.pacman.moving);
      assert(
        comp.soundManager.setAmbience.calledWith(
          comp.determineSiren(comp.remainingDots),
        ),
      );
    });
  });

  describe('updateExtraLivesDisplay', () => {
    it('displays extra life images for each remaining life', () => {
      comp.extraLivesDisplay.firstChild = true;
      comp.extraLivesDisplay.removeChild = sinon.stub(() => {
        comp.extraLivesDisplay.firstChild = false;
      });
      const spy = sinon.fake();
      global.document.createElement = () => ({
        setAttribute: spy,
        style: {},
      });
      comp.lives = 3;

      comp.updateExtraLivesDisplay();
      assert(spy.calledWith('src', 'app/style/graphics/extra_life.svg'));
      assert(spy.calledThrice);
    });
  });

  describe('updateFruitDisplay', () => {
    it('adds a fruit pic to the fruitDisplay', () => {
      const removeSpy = sinon.fake();
      const appendSpy = sinon.fake();
      comp.fruitDisplay = {
        children: { length: 1 },
        removeChild: removeSpy,
        appendChild: appendSpy,
      };
      const attributeSpy = sinon.fake();
      global.document.createElement = () => ({
        setAttribute: attributeSpy,
        style: {},
      });

      comp.updateFruitDisplay('url(image.svg)');
      assert(!removeSpy.called);
      assert(attributeSpy.calledWith('src', 'image.svg'));
      assert(appendSpy.called);

      comp.fruitDisplay.children.length = 7;
      comp.updateFruitDisplay('url(image.svg)');
      assert(removeSpy.called);
    });
  });

  describe('ghostCycle', () => {
    it('changes ghosts to Chase mode after seven seconds', () => {
      comp.ghosts = [{ changeMode: sinon.fake() }];

      comp.ghostCycle('scatter');
      clock.tick(7000);
      assert(comp.ghosts[0].changeMode.calledWith('chase'));
    });
  });

  describe('releaseGhost', () => {
    it('releases a ghost after a delay', () => {
      const spy = sinon.fake();
      comp.idleGhosts = [{ endIdleMode: spy }];
      comp.level = 1;

      comp.releaseGhost();
      clock.tick(8000);
    });

    it('does nothing unless there is an idle ghost to release', () => {
      comp.idleGhosts = [];
      comp.releaseGhost();
    });
  });

  describe('registerEventListeners', () => {
    it('registers listeners for various game events', () => {
      global.window = {
        addEventListener: sinon.fake(),
      };

      comp.registerEventListeners();
      assert(global.window.addEventListener.calledWith('keydown'));
      assert(global.window.addEventListener.calledWith('awardPoints'));
      assert(global.window.addEventListener.calledWith('deathSequence'));
      assert(global.window.addEventListener.calledWith('dotEaten'));
      assert(global.window.addEventListener.calledWith('powerUp'));
      assert(global.window.addEventListener.calledWith('contactlessMode'));
      assert(global.window.addEventListener.calledWith('otpMode'));
      assert(global.window.addEventListener.calledWith('eatGhost'));
      assert(global.window.addEventListener.calledWith('addTimer'));
      assert(global.window.addEventListener.calledWith('removeTimer'));
      assert(global.window.addEventListener.calledWith('releaseGhost'));
    });
  });

  describe('registerTouchListeners', () => {
    it('registers listeners for touches', () => {
      global.document = {
        addEventListener: sinon.fake(),
      };

      comp.registerTouchListeners();
      assert(global.document.addEventListener.calledWith('touchstart'));
      assert(global.document.addEventListener.calledWith('touchend'));
    });
  });

  describe('handleTouchStart', () => {
    it('updates touch values', () => {
      comp.handleTouchStart({ touches: [{ clientX: 100, clientY: 200 }] });
      assert.strictEqual(comp.touchStartX, 100);
      assert.strictEqual(comp.touchStartY, 200);
    });
  });

  describe('handleTouchEnd', () => {
    it('calls the correct direction upon touchEnd', () => {
      const originalX = 100;
      const originalY = 100;
      comp.touchStartX = originalX;
      comp.touchStartY = originalY;
      global.window.dispatchEvent = sinon.fake();

      comp.handleTouchEnd({
        changedTouches: [{ clientX: originalX, clientY: originalY * 2 }],
      });
      assert.strictEqual(global.window.dispatchEvent.firstCall.firstArg.detail.direction, 'down');

      comp.handleTouchEnd({
        changedTouches: [{ clientX: originalX, clientY: originalY * -1 }],
      });
      assert.strictEqual(global.window.dispatchEvent.secondCall.firstArg.detail.direction, 'up');

      comp.handleTouchEnd({
        changedTouches: [{ clientX: originalX * 2, clientY: originalY }],
      });
      assert.strictEqual(global.window.dispatchEvent.thirdCall.firstArg.detail.direction, 'right');

      comp.handleTouchEnd({
        changedTouches: [{ clientX: originalX * -1, clientY: originalY }],
      });
      assert.strictEqual(global.window.dispatchEvent.getCall(3).firstArg.detail.direction, 'left');
    });
  });

  describe('sanitizePlayerName', () => {
    it('returns a default player name when input is blank', () => {
      assert.strictEqual(comp.sanitizePlayerName('   '), 'Player Nexi');
      assert.strictEqual(comp.sanitizePlayerName(null), 'Player Nexi');
    });

    it('normalizes spaces and truncates long names', () => {
      const longName = '  Team    Nexi    VeryVeryLongName  ';
      assert.strictEqual(comp.sanitizePlayerName(longName), 'Team Nexi VeryVeryLo');
    });
  });

  describe('saveLeaderboardEntry', () => {
    it('does nothing if the score is zero', () => {
      comp.points = 0;
      global.localStorage.setItem = sinon.fake();

      comp.saveLeaderboardEntry();
      assert(!global.localStorage.setItem.called);
    });

    it('stores a sorted leaderboard with a max of 20 records', () => {
      const existing = [];
      for (let i = 0; i < 21; i += 1) {
        existing.push({
          name: `Player${i}`,
          score: i,
          date: '2026-01-01T00:00:00.000Z',
        });
      }

      comp.points = 5000;
      comp.currentPlayerName = 'Nexi Hero';
      global.localStorage.getItem = sinon.fake((key) => {
        if (key === 'pacmanNexiLeaderboard') {
          return JSON.stringify(existing);
        }

        return undefined;
      });
      global.localStorage.setItem = sinon.fake();

      comp.saveLeaderboardEntry();
      assert(global.localStorage.setItem.calledOnce);
      assert.strictEqual(global.localStorage.setItem.firstCall.args[0], 'pacmanNexiLeaderboard');

      const saved = JSON.parse(global.localStorage.setItem.firstCall.args[1]);
      assert.strictEqual(saved.length, 20);
      assert.strictEqual(saved[0].name, 'Nexi Hero');
      assert.strictEqual(saved[0].score, 5000);
    });

    it('handles invalid or non-array leaderboard values', () => {
      comp.points = 120;
      comp.currentPlayerName = 'Nexi Dev';
      global.localStorage.setItem = sinon.fake();

      global.localStorage.getItem = sinon.fake.returns('{invalid-json');
      comp.saveLeaderboardEntry();
      let saved = JSON.parse(global.localStorage.setItem.lastCall.args[1]);
      assert.strictEqual(saved.length, 1);

      global.localStorage.getItem = sinon.fake.returns('{"foo":"bar"}');
      comp.saveLeaderboardEntry();
      saved = JSON.parse(global.localStorage.setItem.lastCall.args[1]);
      assert.strictEqual(saved.length, 1);
    });

    it('starts from an empty leaderboard when none is stored', () => {
      comp.points = 240;
      comp.currentPlayerName = 'Nexi Rookie';
      global.localStorage.getItem = sinon.fake.returns(undefined);
      global.localStorage.setItem = sinon.fake();

      comp.saveLeaderboardEntry();
      const saved = JSON.parse(global.localStorage.setItem.firstCall.args[1]);
      assert.strictEqual(saved.length, 1);
      assert.strictEqual(saved[0].name, 'Nexi Rookie');
      assert.strictEqual(saved[0].score, 240);
    });

    it('sorts leaderboard entries with missing scores as zero', () => {
      comp.points = 1;
      comp.currentPlayerName = 'Nexi Finisher';
      global.localStorage.getItem = sinon.fake.returns(JSON.stringify([
        { name: 'No Score' },
        { name: 'Low Score', score: 0 },
      ]));
      global.localStorage.setItem = sinon.fake();

      comp.saveLeaderboardEntry();
      const saved = JSON.parse(global.localStorage.setItem.firstCall.args[1]);
      assert.strictEqual(saved[0].name, 'Nexi Finisher');
      assert.strictEqual(saved[1].score, undefined);
      assert.strictEqual(saved[2].score, 0);
    });
  });

  describe('handleKeyDown', () => {
    beforeEach(() => {
      comp.gameEngine = {};
    });

    it('calls handlePauseKey when esc is pressed', () => {
      comp.handlePauseKey = sinon.fake();

      comp.handleKeyDown({ keyCode: 27 });
      assert(comp.handlePauseKey.called);
    });

    it('calls soundButtonClick when Q is pressed', () => {
      comp.soundButtonClick = sinon.fake();

      comp.handleKeyDown({ keyCode: 81 });
      assert(comp.soundButtonClick.called);
    });

    it("calls Pacman's changeDirection when a move key is pressed", () => {
      comp.gameEngine.running = true;
      const changeSpy = sinon.fake();
      comp.pacman.changeDirection = changeSpy;

      // W Key
      comp.handleKeyDown({ keyCode: 87 });
      assert.strictEqual(changeSpy.callCount, 1);

      // A Key
      comp.handleKeyDown({ keyCode: 65 });
      assert.strictEqual(changeSpy.callCount, 2);

      // S Key
      comp.handleKeyDown({ keyCode: 83 });
      assert.strictEqual(changeSpy.callCount, 3);

      // D Key
      comp.handleKeyDown({ keyCode: 68 });
      assert.strictEqual(changeSpy.callCount, 4);

      // Up Arrow
      comp.handleKeyDown({ keyCode: 38 });
      assert.strictEqual(changeSpy.callCount, 5);

      // Down Arrow
      comp.handleKeyDown({ keyCode: 40 });
      assert.strictEqual(changeSpy.callCount, 6);

      // Left Arrow
      comp.handleKeyDown({ keyCode: 37 });
      assert.strictEqual(changeSpy.callCount, 7);

      // Right Arrow
      comp.handleKeyDown({ keyCode: 39 });
      assert.strictEqual(changeSpy.callCount, 8);
    });

    it("won't call changeDirection unless the gameEngine is running", () => {
      comp.gameEngine.running = false;
      const changeSpy = sinon.fake();
      comp.pacman.changeDirection = changeSpy;

      comp.handleKeyDown({ keyCode: 87 });
      assert(!changeSpy.called);
    });

    it("won't call changeDirection if allowKeyPresses is FALSE", () => {
      comp.allowKeyPresses = false;
      comp.handlePauseKey = sinon.fake();
      comp.pacman.changeDirection = sinon.fake();

      comp.handleKeyDown({ keyCode: 27 });
      assert(comp.handlePauseKey.called);
      comp.handleKeyDown({ keyCode: 87 });
      assert(!comp.pacman.changeDirection.called);
    });

    it("won't call anything if an unrecognized key is pressed", () => {
      comp.gameEngine.changePausedState = sinon.fake();
      comp.pacman.changeDirection = sinon.fake();

      // P Key
      comp.handleKeyDown({ keyCode: 80 });
      assert(!comp.gameEngine.changePausedState.called);
      assert(!comp.pacman.changeDirection.called);
    });

    it('routes keydown events to OTP input while OTP is active', () => {
      const event = { keyCode: 27 };
      comp.otpActive = true;
      comp.handleOtpKeyDown = sinon.fake();
      comp.handlePauseKey = sinon.fake();

      comp.handleKeyDown(event);
      assert(comp.handleOtpKeyDown.calledWith(event));
      assert(!comp.handlePauseKey.called);
    });
  });

  describe('handleSwipe', () => {
    it('calls changeDirection with the direction of the user\'s swipe', () => {
      const spy = sinon.fake();
      comp.changeDirection = spy;

      comp.handleSwipe({ detail: { direction: 'up' } });
      assert(comp.changeDirection.calledWith('up'));
    });
  });

  describe('handlePauseKey', () => {
    beforeEach(() => {
      comp.gameEngine = {
        changePausedState: sinon.fake(),
      };
      comp.activeTimers = [{}];
      comp.allowPause = true;
      comp.cutscene = false;
      comp.soundManager.play = sinon.fake();
      comp.soundManager.resumeAmbience = sinon.fake();
      comp.soundManager.stopAmbience = sinon.fake();
      comp.soundManager.setAmbience = sinon.fake();
    });

    it('calls changePausedState', () => {
      comp.activeTimers = [];
      comp.resumePausedGame = sinon.fake();
      comp.handlePauseKey();
      assert(comp.gameEngine.changePausedState.called);
      assert(comp.soundManager.play.calledWith('pause'));
    });

    it('resumes all timers after starting the engine', () => {
      comp.gameEngine.started = true;
      comp.activeTimers[0].resume = sinon.fake();
      comp.handlePauseKey();
      assert(comp.soundManager.resumeAmbience.called);
      assert.strictEqual(comp.gameUi.style.filter, 'unset');
      assert.strictEqual(comp.pausedText.style.visibility, 'hidden');
      assert(comp.activeTimers[0].resume.called);
    });

    it('pauses all timers after starting the engine', () => {
      comp.gameEngine.pause = true;
      comp.activeTimers[0].pause = sinon.fake();
      comp.handlePauseKey();
      assert(comp.activeTimers[0].pause.called);
    });

    it('waits before allowing another pause key press', () => {
      comp.activeTimers[0].pause = sinon.fake();
      assert(comp.allowPause);
      comp.handlePauseKey();
      assert(!comp.allowPause);
      clock.tick(500);
      assert(comp.allowPause);
    });

    it("won't call changePausedState unless allowPause is TRUE", () => {
      comp.allowPause = false;
      comp.handlePauseKey();
      assert(!comp.gameEngine.changePausedState.called);
    });

    it("won't set allowPause to TRUE if a cutscene is playing", () => {
      comp.activeTimers[0].pause = sinon.fake();
      comp.handlePauseKey();
      comp.cutscene = true;
      assert(!comp.allowPause);
      clock.tick(500);
      assert(!comp.allowPause);
    });
  });

  describe('awardPoints', () => {
    beforeEach(() => {
      comp.updateFruitDisplay = sinon.fake();
      comp.fruit.determineImage = sinon.fake();
    });

    it('adds to the total number of points', () => {
      comp.points = 0;
      global.localStorage.setItem = sinon.fake();

      comp.awardPoints({ detail: { points: 50 } });
      assert.strictEqual(comp.points, 50);
      assert.strictEqual(comp.highScore, 50);
      assert.strictEqual(comp.highScoreDisplay.innerText, 50);
      assert(global.localStorage.setItem.calledWith('highScore', 50));
    });

    it('only updates the highScore when it is surpassed', () => {
      comp.points = 0;
      comp.highScore = 100;

      comp.awardPoints({ detail: { points: 50 } });
      assert.strictEqual(comp.points, 50);
      assert.strictEqual(comp.highScore, 100);
    });

    it('does not let negative points drop the score below zero', () => {
      comp.points = 100;
      comp.highScore = 500;

      comp.awardPoints({ detail: { points: -250, type: 'otp' } });
      assert.strictEqual(comp.points, 0);
      assert.strictEqual(comp.pointsDisplay.innerText, 0);
      assert.strictEqual(comp.highScore, 500);
    });

    it('calls displayText when a fruit is eaten', () => {
      comp.points = 0;
      comp.displayText = sinon.fake();

      comp.awardPoints({ detail: { points: 50, type: 'fruit' } });
      assert.strictEqual(comp.points, 50);
      assert(
        comp.displayText.calledWith(
          {
            left: comp.scaledTileSize * 13,
            top: comp.scaledTileSize * 16.5,
          },
          50,
          2000,
          comp.scaledTileSize * 2,
          comp.scaledTileSize * 2,
        ),
      );
    });

    it('displays a wider image when fruit worth four figures is eaten', () => {
      comp.points = 0;
      comp.displayText = sinon.fake();

      comp.awardPoints({ detail: { points: 1000, type: 'fruit' } });
      assert.strictEqual(comp.points, 1000);
      assert(
        comp.displayText.calledWith(
          {
            left: comp.scaledTileSize * 12.5,
            top: comp.scaledTileSize * 16.5,
          },
          1000,
          2000,
          comp.scaledTileSize * 3,
          comp.scaledTileSize * 2,
        ),
      );
    });

    it('gives an extra life when reaching 10k points', () => {
      comp.points = 0;
      comp.lives = 0;
      comp.extraLifeGiven = false;
      comp.updateExtraLivesDisplay = sinon.fake();
      comp.soundManager.play = sinon.fake();

      comp.awardPoints({ detail: { points: 10000, type: 'fruit' } });
      assert.strictEqual(comp.extraLifeGiven, true);
      assert(comp.soundManager.play.calledWith('extra_life'));
      assert.strictEqual(comp.lives, 1);
      assert(comp.updateExtraLivesDisplay.called);
    });
  });

  describe('displayPointMilestoneMessages', () => {
    beforeEach(() => {
      comp.displayPopMessage = sinon.fake();
    });

    it('shows a pop message when a point milestone is crossed', () => {
      comp.displayPointMilestoneMessages(900, 1000);
      assert.deepEqual(comp.shownPopMessageMilestones, [1000]);
      assert(comp.displayPopMessage.calledWith('Tap streak!', 'streak'));
    });

    it('shows the latest milestone when points jump across multiple thresholds', () => {
      comp.displayPointMilestoneMessages(900, 6000);
      assert.deepEqual(comp.shownPopMessageMilestones, [1000, 2500, 5000]);
      assert(comp.displayPopMessage.calledOnceWith(
        'Authorization approved',
        'approved',
      ));
    });

    it('does not show the same milestone twice', () => {
      comp.shownPopMessageMilestones = [1000];

      comp.displayPointMilestoneMessages(900, 1200);
      assert(!comp.displayPopMessage.called);
    });

    it('does nothing before reaching a milestone', () => {
      comp.displayPointMilestoneMessages(500, 900);
      assert.deepEqual(comp.shownPopMessageMilestones, []);
      assert(!comp.displayPopMessage.called);
    });
  });

  describe('deathSequence', () => {
    beforeEach(() => {
      comp.allowKeyPresses = true;
      comp.blinky.display = true;
      comp.pacman.moving = true;
      comp.blinky.moving = true;
      comp.lives = 2;
      comp.mazeCover.style = {
        visibility: 'hidden',
      };
      comp.pacman.prepDeathAnimation = sinon.fake();
      comp.pacman.reset = sinon.fake();
      comp.blinky.reset = sinon.fake();
      comp.fruit.hideFruit = sinon.fake();
      comp.updateExtraLivesDisplay = sinon.fake();
    });

    it('kills Pacman, subtracts a life, and resets the characters', () => {
      comp.deathSequence();
      assert(!comp.allowKeyPresses);
      assert(!comp.pacman.moving);
      assert(!comp.blinky.moving);

      clock.tick(750);
      assert(!comp.blinky.display);
      assert(comp.pacman.prepDeathAnimation.called);
      assert.strictEqual(comp.lives, 1);

      clock.tick(2250);
      assert.strictEqual(comp.mazeCover.style.visibility, 'visible');

      clock.tick(500);
      assert(comp.allowKeyPresses);
      assert.strictEqual(comp.mazeCover.style.visibility, 'hidden');
      assert(comp.pacman.reset.called);
      assert(comp.blinky.reset.called);
      assert(comp.fruit.hideFruit.called);
    });

    it('cancels the fruitTimer if needed', () => {
      comp.timerExists = sinon.fake.returns(true);
      comp.removeTimer = sinon.fake();

      comp.deathSequence();
      assert(comp.removeTimer.called);
    });

    it('handles Game Over if needed', () => {
      comp.lives = 0;
      comp.gameOver = sinon.fake();

      comp.deathSequence();

      clock.tick(750);
      assert(comp.gameOver.called);
    });
  });

  describe('gameOver', () => {
    it('displays GAME OVER text and brings back the main menu', () => {
      comp.displayText = sinon.fake();
      comp.fruit.hideFruit = sinon.fake();
      global.localStorage.setItem = sinon.fake();

      comp.gameOver();
      assert(
        global.localStorage.setItem.calledWith('highScore', comp.highScore),
      );

      clock.tick(2250);
      assert(comp.displayText.called);
      assert(comp.fruit.hideFruit.called);

      clock.tick(2500);
      assert.strictEqual(comp.leftCover.style.left, '0');
      assert.strictEqual(comp.rightCover.style.right, '0');

      clock.tick(1000);
      assert.strictEqual(comp.mainMenu.style.opacity, 1);
      assert.strictEqual(comp.gameStartButton.disabled, false);
      assert.strictEqual(comp.mainMenu.style.visibility, 'visible');
    });
  });

  describe('dotEaten', () => {
    it('subtracts 1 from remainingDots', () => {
      comp.remainingDots = 10;
      comp.dotEaten();
      assert.strictEqual(comp.remainingDots, 9);
    });

    it('creates a fruit at 174 and 74 remaining dots', () => {
      comp.createFruit = sinon.fake();

      comp.remainingDots = 175;
      comp.dotEaten();
      assert(comp.createFruit.calledOnce);

      comp.remainingDots = 75;
      comp.dotEaten();
      assert(comp.createFruit.calledTwice);
    });

    it('speeds up Blinky at 40 and 20 dots', () => {
      comp.speedUpBlinky = sinon.fake();

      comp.remainingDots = 41;
      comp.dotEaten();
      assert(comp.speedUpBlinky.calledOnce);

      comp.remainingDots = 21;
      comp.dotEaten();
      assert(comp.speedUpBlinky.calledTwice);
    });

    it('calls advanceLevel at 0 dots', () => {
      comp.advanceLevel = sinon.fake();

      comp.remainingDots = 1;
      comp.dotEaten();
      assert(comp.advanceLevel.called);
    });
  });

  describe('createFruit', () => {
    it('creates a bonus fruit for ten seconds', () => {
      comp.fruit.showFruit = sinon.fake();
      comp.fruit.hideFruit = sinon.fake();

      comp.createFruit();
      assert(comp.fruit.showFruit.called);

      clock.tick(10000);
      assert(comp.fruit.hideFruit.called);
    });

    it('cancels the fruitTimer if needed', () => {
      comp.timerExists = sinon.fake.returns(true);
      comp.removeTimer = sinon.fake();
      comp.fruit.showFruit = sinon.fake();

      comp.createFruit();
      assert(comp.removeTimer.called);
    });

    it('calls showFruit for 5000 points for unrecognized levels', () => {
      comp.level = Infinity;
      comp.fruit.showFruit = sinon.fake();

      comp.createFruit();
      assert(comp.fruit.showFruit.calledWith(5000));
    });
  });

  describe('startContactlessSpawnCycle', () => {
    it('creates a Contactless pickup after twenty seconds', () => {
      comp.removeTimer = sinon.fake();
      comp.createContactlessPickup = sinon.fake();

      comp.startContactlessSpawnCycle();
      assert(comp.removeTimer.called);

      clock.tick(20000);
      assert(comp.createContactlessPickup.called);
    });
  });

  describe('createContactlessPickup', () => {
    it('shows the Contactless pickup and schedules hide and next spawn', () => {
      comp.determineContactlessSpawnPosition = sinon.fake.returns({
        column: 5,
        row: 6,
      });
      comp.hideContactlessPickup = sinon.fake();
      comp.startContactlessSpawnCycle = sinon.fake();
      comp.contactlessPickup.showContactless = sinon.fake();

      comp.createContactlessPickup();
      assert(comp.hideContactlessPickup.called);
      assert(comp.contactlessPickup.showContactless.calledWith(
        5,
        6,
        comp.scaledTileSize,
      ));
      assert(comp.startContactlessSpawnCycle.called);

      clock.tick(10000);
      assert.strictEqual(comp.hideContactlessPickup.callCount, 2);
    });
  });

  describe('hideContactlessPickup', () => {
    it('removes the hide timer and hides the pickup', () => {
      comp.removeTimer = sinon.fake();
      comp.contactlessPickup.hideContactless = sinon.fake();
      comp.contactlessHideTimer = { timerId: 123 };

      comp.hideContactlessPickup();
      assert.strictEqual(comp.contactlessHideTimer, undefined);
      assert(comp.removeTimer.calledWith({
        detail: {
          timer: { timerId: 123 },
        },
      }));
      assert(comp.contactlessPickup.hideContactless.called);
    });
  });

  describe('determineContactlessSpawnPosition', () => {
    afterEach(() => {
      if (Math.random.restore) {
        Math.random.restore();
      }
    });

    it('chooses a valid pacdot tile', () => {
      sinon.stub(Math, 'random').returns(0);
      comp.mazeArray = mazeArray;

      assert.deepEqual(comp.determineContactlessSpawnPosition(), {
        column: 1,
        row: 1,
      });
    });

    it('throws if no pacdot tile is available', () => {
      comp.mazeArray = [
        ['X', 'X'],
        ['X', ' '],
      ];

      assert.throws(
        () => comp.determineContactlessSpawnPosition(),
        /No contactless spawn positions available/,
      );
    });
  });

  describe('contactlessMode', () => {
    it('hides the pickup and activates Contactless Mode', () => {
      comp.hideContactlessPickup = sinon.fake();
      comp.activateContactlessMode = sinon.fake();
      comp.displayPopMessage = sinon.fake();

      comp.contactlessMode();
      assert(comp.hideContactlessPickup.called);
      assert(comp.activateContactlessMode.called);
      assert(comp.displayPopMessage.calledWith(
        'Contactless boost',
        'contactless',
      ));
    });
  });

  describe('startOtpSpawnCycle', () => {
    it('creates an OTP pickup after twenty seconds', () => {
      comp.removeTimer = sinon.fake();
      comp.createOtpPickup = sinon.fake();

      comp.startOtpSpawnCycle();
      assert(comp.removeTimer.called);

      clock.tick(20000);
      assert(comp.createOtpPickup.called);
    });
  });

  describe('createOtpPickup', () => {
    it('shows the OTP pickup and schedules hide and next spawn', () => {
      comp.determineOtpSpawnPosition = sinon.fake.returns({
        column: 5,
        row: 6,
      });
      comp.hideOtpPickup = sinon.fake();
      comp.startOtpSpawnCycle = sinon.fake();
      comp.otpPickup.showOtp = sinon.fake();

      comp.createOtpPickup();
      assert(comp.hideOtpPickup.called);
      assert(comp.otpPickup.showOtp.calledWith(
        5,
        6,
        comp.scaledTileSize,
      ));
      assert(comp.startOtpSpawnCycle.called);

      clock.tick(10000);
      assert.strictEqual(comp.hideOtpPickup.callCount, 2);
    });
  });

  describe('hideOtpPickup', () => {
    it('removes the hide timer and hides the pickup', () => {
      comp.removeTimer = sinon.fake();
      comp.otpPickup.hideOtp = sinon.fake();
      comp.otpHideTimer = { timerId: 123 };

      comp.hideOtpPickup();
      assert.strictEqual(comp.otpHideTimer, undefined);
      assert(comp.removeTimer.calledWith({
        detail: {
          timer: { timerId: 123 },
        },
      }));
      assert(comp.otpPickup.hideOtp.called);
    });
  });

  describe('determineOtpSpawnPosition', () => {
    afterEach(() => {
      if (Math.random.restore) {
        Math.random.restore();
      }
    });

    it('chooses a valid pacdot tile', () => {
      sinon.stub(Math, 'random').returns(0);
      comp.mazeArray = mazeArray;

      assert.deepEqual(comp.determineOtpSpawnPosition(), {
        column: 1,
        row: 1,
      });
    });
  });

  describe('otpMode', () => {
    it('hides the pickup and starts the OTP challenge', () => {
      comp.hideOtpPickup = sinon.fake();
      comp.startOtpChallenge = sinon.fake();

      comp.otpMode();
      assert(comp.hideOtpPickup.called);
      assert(comp.startOtpChallenge.called);
    });
  });

  describe('generateOtpCode', () => {
    afterEach(() => {
      if (Math.random.restore) {
        Math.random.restore();
      }
    });

    it('generates a four-digit string', () => {
      sinon.stub(Math, 'random').returns(0.042);
      assert.strictEqual(comp.generateOtpCode(), '0420');
    });
  });

  describe('startOtpChallenge', () => {
    it('shows the code, then the input, then expires', () => {
      comp.clearOtpChallenge = sinon.fake();
      comp.pauseGameplayForOtpChallenge = sinon.fake();
      comp.generateOtpCode = sinon.fake.returns('1234');
      comp.displayOtpCode = sinon.fake();
      comp.displayOtpInput = sinon.fake();
      comp.completeOtpChallenge = sinon.fake();

      comp.startOtpChallenge();
      assert(comp.clearOtpChallenge.calledWith(false));
      assert(comp.pauseGameplayForOtpChallenge.called);
      assert.strictEqual(comp.otpCode, '1234');
      assert.strictEqual(comp.otpInput, '');
      assert(comp.otpActive);
      assert(!comp.otpAcceptingInput);
      assert(comp.displayOtpCode.called);

      clock.tick(comp.otpCodeDuration);
      assert(comp.otpAcceptingInput);
      assert(comp.displayOtpInput.called);

      clock.tick(comp.otpInputDuration);
      assert(comp.completeOtpChallenge.calledWith('expired'));
    });
  });

  describe('pauseGameplayForOtpChallenge', () => {
    it('freezes and restores moving entities and timers', () => {
      const timer = {
        pause: sinon.fake(),
        resume: sinon.fake(),
      };
      const movingEntity = { moving: true };
      const stoppedEntity = { moving: false };
      comp.activeTimers = [timer];
      comp.entityList = [movingEntity, {}, stoppedEntity];
      comp.allowKeyPresses = true;
      comp.allowPacmanMovement = true;
      comp.allowPause = true;

      comp.pauseGameplayForOtpChallenge();
      assert(!comp.allowKeyPresses);
      assert(!comp.allowPacmanMovement);
      assert(!comp.allowPause);
      assert(!movingEntity.moving);
      assert(!stoppedEntity.moving);
      assert(timer.pause.calledWith(true));

      comp.resumeGameplayAfterOtpChallenge();
      assert(comp.allowKeyPresses);
      assert(comp.allowPacmanMovement);
      assert(comp.allowPause);
      assert(movingEntity.moving);
      assert(!stoppedEntity.moving);
      assert(timer.resume.calledWith(true));

      comp.resumeGameplayAfterOtpChallenge();
    });
  });

  describe('clearOtpChallenge', () => {
    it('removes OTP state and resumes gameplay when requested', () => {
      comp.removeTimer = sinon.fake();
      comp.clearOtpOverlay = sinon.fake();
      comp.resumeGameplayAfterOtpChallenge = sinon.fake();
      comp.otpRevealTimer = { timerId: 1 };
      comp.otpTimeoutTimer = { timerId: 2 };
      comp.otpActive = true;
      comp.otpAcceptingInput = true;
      comp.otpCode = '1234';
      comp.otpInput = '12';
      comp.otpInputBoxes = [{}, {}];

      comp.clearOtpChallenge(true);
      assert(comp.removeTimer.calledWith({
        detail: {
          timer: { timerId: 1 },
        },
      }));
      assert(comp.removeTimer.calledWith({
        detail: {
          timer: { timerId: 2 },
        },
      }));
      assert(comp.clearOtpOverlay.called);
      assert(comp.resumeGameplayAfterOtpChallenge.called);
      assert.strictEqual(comp.otpRevealTimer, undefined);
      assert.strictEqual(comp.otpTimeoutTimer, undefined);
      assert.strictEqual(comp.otpActive, false);
      assert.strictEqual(comp.otpAcceptingInput, false);
      assert.strictEqual(comp.otpCode, '');
      assert.strictEqual(comp.otpInput, '');
      assert.deepEqual(comp.otpInputBoxes, []);
    });
  });

  describe('OTP overlay', () => {
    it('displays and clears the code overlay', () => {
      const overlay = {
        appendChild: sinon.fake(),
        classList: { add: sinon.fake() },
      };
      const label = {
        classList: { add: sinon.fake() },
      };
      const digits = {
        appendChild: sinon.fake(),
        classList: { add: sinon.fake() },
      };
      const digitBox = {
        classList: { add: sinon.fake() },
      };
      global.document.createElement = sinon.stub();
      global.document.createElement.onFirstCall().returns(overlay);
      global.document.createElement.onSecondCall().returns(label);
      global.document.createElement.onThirdCall().returns(digits);
      global.document.createElement.returns(digitBox);
      comp.mazeDiv = {
        appendChild: sinon.fake(),
        removeChild: sinon.fake(),
      };
      comp.otpCode = '1234';

      comp.displayOtpCode();
      assert(overlay.classList.add.calledWith('otp-overlay', 'otp-code-reveal'));
      assert.strictEqual(label.innerText, 'OTP');
      assert.strictEqual(digits.appendChild.callCount, 4);
      assert(comp.mazeDiv.appendChild.calledWith(overlay));

      comp.clearOtpOverlay();
      assert(comp.mazeDiv.removeChild.calledWith(overlay));
    });

    it('displays input boxes and updates entered digits', () => {
      comp.mazeDiv = {
        appendChild: sinon.fake(),
        removeChild: sinon.fake(),
      };
      comp.otpInput = '12';

      comp.displayOtpInput();
      assert.strictEqual(comp.otpInputBoxes.length, 4);
      assert.strictEqual(comp.otpInputBoxes[0].innerText, '1');
      assert.strictEqual(comp.otpInputBoxes[1].innerText, '2');
      assert.strictEqual(comp.otpInputBoxes[2].innerText, '');
      assert(comp.mazeDiv.appendChild.called);
    });
  });

  describe('handleOtpKeyDown', () => {
    beforeEach(() => {
      comp.otpInputBoxes = [{}, {}, {}, {}];
      comp.updateOtpInputDisplay = sinon.fake();
      comp.verifyOtpInput = sinon.fake();
    });

    it('prevents input while the code is being shown', () => {
      const preventDefault = sinon.fake();
      comp.otpAcceptingInput = false;

      comp.handleOtpKeyDown({ key: '1', keyCode: 49, preventDefault });
      assert(preventDefault.called);
      assert.strictEqual(comp.otpInput || '', '');
    });

    it('accepts digits and backspace', () => {
      comp.otpAcceptingInput = true;
      comp.otpInput = '';

      comp.handleOtpKeyDown({ key: '1', keyCode: 49 });
      assert.strictEqual(comp.otpInput, '1');
      assert(comp.updateOtpInputDisplay.called);

      comp.handleOtpKeyDown({ key: 'Backspace', keyCode: 8 });
      assert.strictEqual(comp.otpInput, '');
    });

    it('accepts numpad digits and ignores other keys', () => {
      comp.otpAcceptingInput = true;
      comp.otpInput = '';

      comp.handleOtpKeyDown({ keyCode: 97 });
      assert.strictEqual(comp.otpInput, '1');

      comp.handleOtpKeyDown({ key: 'a', keyCode: 65 });
      assert.strictEqual(comp.otpInput, '1');
    });

    it('verifies after four digits', () => {
      comp.otpAcceptingInput = true;
      comp.otpInput = '123';

      comp.handleOtpKeyDown({ key: '4', keyCode: 52 });
      assert(comp.verifyOtpInput.called);
    });
  });

  describe('verifyOtpInput', () => {
    it('approves the matching code', () => {
      comp.completeOtpChallenge = sinon.fake();
      comp.otpCode = '1234';
      comp.otpInput = '1234';

      comp.verifyOtpInput();
      assert(comp.completeOtpChallenge.calledWith('approved'));
    });

    it('fails the wrong code', () => {
      comp.completeOtpChallenge = sinon.fake();
      comp.otpCode = '1234';
      comp.otpInput = '9999';

      comp.verifyOtpInput();
      assert(comp.completeOtpChallenge.calledWith('failed'));
    });
  });

  describe('completeOtpChallenge', () => {
    beforeEach(() => {
      comp.clearOtpChallenge = sinon.fake();
      comp.awardPoints = sinon.fake();
      comp.displayPopMessage = sinon.fake();
    });

    it('awards points on approved OTP', () => {
      comp.completeOtpChallenge('approved');
      assert(comp.clearOtpChallenge.calledWith(true));
      assert(comp.awardPoints.calledWith({
        detail: {
          points: comp.otpBonusPoints,
          type: 'otp',
        },
      }));
      assert(comp.displayPopMessage.calledWith('OTP approved', 'otp-approved'));
    });

    it('subtracts points on failed OTP', () => {
      comp.completeOtpChallenge('failed');
      assert(comp.awardPoints.calledWith({
        detail: {
          points: -comp.otpPenaltyPoints,
          type: 'otp',
        },
      }));
      assert(comp.displayPopMessage.calledWith('OTP failed', 'otp-failed'));
    });

    it('subtracts points on expired OTP', () => {
      comp.completeOtpChallenge('expired');
      assert(comp.awardPoints.calledWith({
        detail: {
          points: -comp.otpPenaltyPoints,
          type: 'otp',
        },
      }));
      assert(comp.displayPopMessage.calledWith('OTP expired', 'otp-expired'));
    });
  });

  describe('speedUpBlinky', () => {
    beforeEach(() => {
      comp.blinky.speedUp = sinon.fake();
    });

    it('calls the speedUp function for Blinky', () => {
      comp.speedUpBlinky();
      assert(comp.blinky.speedUp.called);
    });

    it('calls setAmbience if there are no scared or eye ghosts', () => {
      comp.scaredGhosts = [];
      comp.eyeGhosts = 0;
      comp.soundManager.setAmbience = sinon.fake();
      comp.determineSiren = sinon.fake();

      comp.speedUpBlinky();
      assert(
        comp.soundManager.setAmbience.calledWith(
          comp.determineSiren(comp.remainingDots),
        ),
      );
    });

    it('does not call setAmbience otherwise', () => {
      comp.scaredGhosts = [];
      comp.eyeGhosts = 1;
      comp.soundManager.setAmbience = sinon.fake();
      comp.determineSiren = sinon.fake();

      comp.speedUpBlinky();
      assert(!comp.soundManager.setAmbience.called);
    });
  });

  describe('determineSiren', () => {
    it('determines the correct siren ambience', () => {
      assert.strictEqual(comp.determineSiren(100), 'siren_1');
      assert.strictEqual(comp.determineSiren(30), 'siren_2');
      assert.strictEqual(comp.determineSiren(10), 'siren_3');
    });
  });

  describe('advanceLevel', () => {
    it('runs the sequence for advancing to the next level', () => {
      const ghost = new Ghost();
      ghost.reset = sinon.fake();
      ghost.resetDefaultSpeed = sinon.fake();
      ghost.name = 'blinky';
      ghost.level = 1;
      const fruit = new Pickup();
      const pacdot = new Pickup();
      fruit.reset = sinon.fake();
      fruit.type = 'fruit';
      pacdot.reset = sinon.fake();
      comp.entityList = [ghost, fruit, pacdot];
      comp.mazeCover = { style: {} };
      comp.remainingDots = 0;
      comp.removeTimer = sinon.fake();
      comp.updateExtraLivesDisplay = sinon.fake();
      const imgBase = 'app/style//graphics/spriteSheets/maze/';

      comp.advanceLevel();
      assert(!comp.allowKeyPresses);
      assert(
        comp.removeTimer.calledWith({ detail: { timer: comp.ghostTimer } }),
      );

      clock.tick(2000);
      assert.strictEqual(comp.mazeImg.src, `${imgBase}maze_white.svg`);

      clock.tick(250);
      assert.strictEqual(comp.mazeImg.src, `${imgBase}maze_blue.svg`);

      clock.tick(250);
      assert.strictEqual(comp.mazeImg.src, `${imgBase}maze_white.svg`);

      clock.tick(250);
      assert.strictEqual(comp.mazeImg.src, `${imgBase}maze_blue.svg`);

      clock.tick(250);
      assert.strictEqual(comp.mazeImg.src, `${imgBase}maze_white.svg`);

      clock.tick(250);
      assert.strictEqual(comp.mazeImg.src, `${imgBase}maze_blue.svg`);

      clock.tick(250);
      assert.strictEqual(comp.mazeCover.style.visibility, 'visible');

      clock.tick(500);
      assert.strictEqual(comp.mazeCover.style.visibility, 'hidden');
      assert.strictEqual(comp.level, 2);
      assert(comp.allowKeyPresses);
      assert.strictEqual(ghost.level, comp.level);
      assert(ghost.resetDefaultSpeed.called);
      assert.strictEqual(comp.remainingDots, 1);
    });
  });

  describe('flashGhosts', () => {
    it('calls itself recursively a number of times', () => {
      comp.scaredGhosts = [
        {
          toggleScaredColor: sinon.fake(),
          endScared: sinon.fake(),
        },
      ];
      sinon.spy(comp, 'flashGhosts');
      comp.soundManager.setAmbience = sinon.fake();
      comp.determineSiren = sinon.fake();
      comp.eyeGhosts = 0;

      comp.flashGhosts(0, 9);
      clock.tick(10000);
      assert.strictEqual(comp.flashGhosts.callCount, 10);
      assert(
        comp.soundManager.setAmbience.calledWith(
          comp.determineSiren(comp.remainingDots),
        ),
      );
    });

    it('will not set ambience if there are eye ghosts', () => {
      comp.scaredGhosts = [
        {
          toggleScaredColor: sinon.fake(),
          endScared: sinon.fake(),
        },
      ];
      sinon.spy(comp, 'flashGhosts');
      comp.soundManager.setAmbience = sinon.fake();
      comp.eyeGhosts = 1;

      comp.flashGhosts(0, 9);
      clock.tick(10000);
      assert.strictEqual(comp.flashGhosts.callCount, 10);
      assert(!comp.soundManager.setAmbience.called);
    });

    it('stops calls if there are no more scared ghosts', () => {
      comp.flashingGhosts = true;
      comp.scaredGhosts = [];
      sinon.spy(comp, 'flashGhosts');

      comp.flashGhosts(0, 9);
      clock.tick(10000);
      assert.strictEqual(comp.flashGhosts.callCount, 1);
    });
  });

  describe('powerUp', () => {
    beforeEach(() => {
      comp.removeTimer = sinon.fake();
      comp.pacman.activateContactlessMode = sinon.fake();
      comp.pacman.deactivateContactlessMode = sinon.fake();
      comp.ghosts = [
        { becomeScared: sinon.fake(), mode: 'eyes' },
        { becomeScared: sinon.fake(), mode: 'chase' },
      ];
      comp.flashGhosts = sinon.fake();
    });

    it('establishes scaredGhosts and calls flashGhosts', () => {
      comp.timerExists = sinon.fake.returns(true);

      comp.powerUp();
      clock.tick(6000);
      assert(comp.removeTimer.called);
      assert(comp.scaredGhosts[0].becomeScared.called);
      assert(comp.flashGhosts.calledWith(0, 9));
    });

    it("won't push EYES mode ghosts to the scaredGhosts array", () => {
      comp.timerExists = sinon.fake.returns(false);

      comp.powerUp();
      assert.strictEqual(comp.scaredGhosts.length, 1);
    });

    it('calls setAmbience if remainingDots is greater than zero', () => {
      comp.soundManager.setAmbience = sinon.fake();
      comp.remainingDots = 0;

      comp.powerUp();
      assert(!comp.soundManager.setAmbience.called);

      comp.remainingDots = 1;
      comp.powerUp();
      assert(comp.soundManager.setAmbience.calledWith('power_up'));
    });

    it('does not activate Contactless Mode', () => {
      comp.powerUp();
      assert(!comp.pacman.activateContactlessMode.called);
    });
  });

  describe('activateContactlessMode', () => {
    beforeEach(() => {
      comp.removeTimer = sinon.fake();
      comp.pacman.activateContactlessMode = sinon.fake();
      comp.pacman.deactivateContactlessMode = sinon.fake();
    });

    it('activates Contactless Mode', () => {
      comp.activateContactlessMode();
      assert(comp.pacman.activateContactlessMode.calledWith(comp.scaledTileSize * 3));
    });

    it('deactivates Contactless Mode after five seconds', () => {
      comp.activateContactlessMode();
      clock.tick(5000);
      assert(comp.pacman.deactivateContactlessMode.called);
    });

    it('cancels an existing Contactless timer before starting a new one', () => {
      comp.contactlessTimer = { timerId: 123 };

      comp.activateContactlessMode();
      assert(comp.removeTimer.calledWith({
        detail: {
          timer: { timerId: 123 },
        },
      }));
    });
  });

  describe('deactivateContactlessMode', () => {
    it('removes the Contactless timer and deactivates Pacman', () => {
      comp.removeTimer = sinon.fake();
      comp.pacman.deactivateContactlessMode = sinon.fake();
      comp.contactlessTimer = { timerId: 123 };

      comp.deactivateContactlessMode();
      assert.strictEqual(comp.contactlessTimer, undefined);
      assert(comp.removeTimer.calledWith({
        detail: {
          timer: { timerId: 123 },
        },
      }));
      assert(comp.pacman.deactivateContactlessMode.called);
    });
  });

  describe('determineComboPoints', () => {
    it('returns the correct points based on combo', () => {
      comp.ghostCombo = 1;
      assert.strictEqual(comp.determineComboPoints(), 200);
      comp.ghostCombo = 2;
      assert.strictEqual(comp.determineComboPoints(), 400);
      comp.ghostCombo = 3;
      assert.strictEqual(comp.determineComboPoints(), 800);
      comp.ghostCombo = 4;
      assert.strictEqual(comp.determineComboPoints(), 1600);
    });
  });

  describe('eatGhost', () => {
    it('awards points and temporarily pauses movement', () => {
      comp.allowPacmanMovement = true;
      comp.displayText = sinon.fake();
      const ghost = {
        display: true,
        name: 'blinky',
        pause: sinon.fake(),
      };
      const e = {
        detail: {
          ghost,
        },
      };
      comp.scaredGhosts = [ghost];
      comp.determineComboPoints = sinon.fake();
      global.window.dispatchEvent = sinon.fake();
      global.CustomEvent = class {};

      comp.eatGhost(e);
      assert(!comp.allowPacmanMovement);
      assert(!e.detail.ghost.display);
      assert(!comp.pacman.moving);
      assert(!comp.blinky.moving);
      assert(
        global.window.dispatchEvent.calledWith(
          new CustomEvent('awardPoints', {
            detail: {
              points: 200,
            },
          }),
        ),
      );
      assert(comp.displayText.called);
      assert(comp.determineComboPoints.called);

      clock.tick(1000);
      assert(comp.allowPacmanMovement);
      assert(e.detail.ghost.display);
      assert(comp.pacman.moving);
    });
  });

  describe('restoreGhost', () => {
    beforeEach(() => {
      comp.determineSiren = sinon.fake();
      comp.soundManager.setAmbience = sinon.fake();
    });

    it('only calls setAmbience when there are zero eye ghosts', () => {
      comp.eyeGhosts = 2;
      comp.restoreGhost();
      assert(!comp.soundManager.setAmbience.called);
    });

    it('subtracts from eyeGhost and calls setAmbience', () => {
      comp.eyeGhosts = 1;

      comp.restoreGhost();
      assert.strictEqual(comp.eyeGhosts, 0);
      assert(
        comp.soundManager.setAmbience.calledWith(
          comp.determineSiren(comp.remainingDots),
        ),
      );

      comp.eyeGhosts = 1;
      comp.scaredGhosts = [1, 2, 3];
      comp.restoreGhost();
      assert(comp.soundManager.setAmbience.calledWith('power_up'));
    });
  });

  describe('displayText', () => {
    it('creates a temporary div and removes it with a set delay', () => {
      comp.mazeDiv = {
        appendChild: sinon.fake(),
        removeChild: sinon.fake(),
      };

      comp.displayText({ left: 10, top: 25 }, 200, 1000, 48);
      assert(comp.mazeDiv.appendChild.called);

      clock.tick(1000);
      assert(comp.mazeDiv.removeChild.called);
    });
  });

  describe('displayPopMessage', () => {
    it('creates a temporary pop message and removes it with a set delay', () => {
      const popMessage = {
        appendChild: sinon.fake(),
        classList: {
          add: sinon.fake(),
        },
        style: {},
      };
      const letterSpan = {
        classList: {
          add: sinon.fake(),
        },
        style: {},
      };
      comp.mazeDiv = {
        appendChild: sinon.fake(),
        removeChild: sinon.fake(),
      };
      global.document.createElement = sinon.stub();
      global.document.createElement.onFirstCall().returns(popMessage);
      global.document.createElement.returns(letterSpan);

      comp.displayPopMessage('Tap streak!', 'streak');
      assert(popMessage.classList.add.calledWith(
        'pop-message',
        'pop-message-streak',
      ));
      assert.strictEqual(popMessage.appendChild.callCount, 11);
      assert(letterSpan.classList.add.calledWith('pop-message-letter'));
      assert.strictEqual(letterSpan.style.animationDelay, '450ms');
      assert.strictEqual(popMessage.style.left, `${comp.scaledTileSize * 14}px`);
      assert.strictEqual(popMessage.style.top, `${comp.scaledTileSize * 9}px`);
      assert(comp.mazeDiv.appendChild.calledWith(popMessage));

      clock.tick(2200);
      assert(comp.mazeDiv.removeChild.calledWith(popMessage));
      assert.strictEqual(comp.popMessage, undefined);
      assert.strictEqual(comp.popMessageTimer, undefined);
    });

    it('does not let an old timer remove a newer pop message', () => {
      const firstPopMessage = {
        appendChild: sinon.fake(),
        classList: {
          add: sinon.fake(),
        },
        style: {},
      };
      const secondPopMessage = {
        appendChild: sinon.fake(),
        classList: {
          add: sinon.fake(),
        },
        style: {},
      };
      const letterSpan = {
        classList: {
          add: sinon.fake(),
        },
        style: {},
      };
      comp.mazeDiv = {
        appendChild: sinon.fake(),
        removeChild: sinon.fake(),
      };
      global.document.createElement = sinon.stub();
      global.document.createElement.onFirstCall().returns(firstPopMessage);
      global.document.createElement.onCall(12).returns(secondPopMessage);
      global.document.createElement.returns(letterSpan);

      comp.displayPopMessage('Tap streak!', 'streak');
      clock.tick(500);
      comp.displayPopMessage('Cashback ioSi!', 'cashback');
      assert(comp.mazeDiv.removeChild.calledOnceWith(firstPopMessage));

      clock.tick(1700);
      assert.strictEqual(comp.popMessage, secondPopMessage);
      assert(comp.mazeDiv.removeChild.calledOnce);

      clock.tick(500);
      assert(comp.mazeDiv.removeChild.calledTwice);
      assert(comp.mazeDiv.removeChild.calledWith(secondPopMessage));
    });
  });

  describe('addTimer', () => {
    it('adds a timer object to the list of active timers', () => {
      comp.activeTimers = [];
      comp.addTimer({
        detail: 'newTimer',
      });
      assert.strictEqual(comp.activeTimers.length, 1);
    });
  });

  describe('timerExists', () => {
    it('checks if a given timerId exists', () => {
      assert(comp.timerExists({ detail: { timer: { timerId: 1 } } }));
      assert(!comp.timerExists({ detail: { timer: { timerId: undefined } } }));
    });
  });

  describe('pauseTimer', () => {
    it('pauses an existing timer', () => {
      const spy = sinon.fake();

      comp.timerExists = sinon.fake.returns(false);
      comp.pauseTimer({ detail: { timer: { pause: spy } } });
      assert(!spy.calledWith(true));

      comp.timerExists = sinon.fake.returns(true);
      comp.pauseTimer({ detail: { timer: { pause: spy } } });
      assert(spy.calledWith(true));
    });
  });

  describe('resumeTimer', () => {
    it('resumes an existing timer', () => {
      const spy = sinon.fake();

      comp.timerExists = sinon.fake.returns(false);
      comp.resumeTimer({ detail: { timer: { resume: spy } } });
      assert(!spy.calledWith(true));

      comp.timerExists = sinon.fake.returns(true);
      comp.resumeTimer({ detail: { timer: { resume: spy } } });
      assert(spy.calledWith(true));
    });
  });

  describe('removeTimer', () => {
    it('removes a timer from the active timers list based on timerId', () => {
      global.window.clearTimeout = sinon.fake();
      comp.activeTimers = [{ timerId: 1 }, { timerId: 2 }];
      comp.removeTimer({
        detail: { timer: { timerId: 1 } },
      });
      assert(global.window.clearTimeout.calledWith(1));
      assert.strictEqual(comp.activeTimers.length, 1);
    });

    it('checks if a timer exists before removing it', () => {
      comp.timerExists = sinon.fake.returns(false);

      comp.removeTimer({
        detail: { id: 1 },
      });
      assert(comp.timerExists.called);
    });
  });
});
