class CharacterUtil {
  constructor(scaledTileSize) {
    this.scaledTileSize = scaledTileSize;
    this.threshold = 5 * this.scaledTileSize;
    this.directions = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
    };
  }

  /**
   * Check if a given character has moved more than five in-game tiles during a frame.
   * If so, we want to temporarily hide the object to avoid 'animation stutter'.
   * @param {({top: number, left: number})} position - Position during the current frame
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @returns {('hidden'|'visible')} - The new 'visibility' css property value for the character.
   */
  checkForStutter(position, oldPosition) {
    let stutter = false;

    if (position && oldPosition) {
      if (Math.abs(position.top - oldPosition.top) > this.threshold
        || Math.abs(position.left - oldPosition.left) > this.threshold) {
        stutter = true;
      }
    }

    return stutter ? 'hidden' : 'visible';
  }

  /**
   * Check which CSS property needs to be changed given the character's current direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('top'|'left')}
   */
  getPropertyToChange(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        return 'top';
      default:
        return 'left';
    }
  }

  /**
   * Calculate the velocity for the character's next frame.
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @returns {number} - Moving down or right is positive, while up or left is negative.
   */
  getVelocity(direction, velocityPerMs) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return velocityPerMs * -1;
      default:
        return velocityPerMs;
    }
  }

  /**
   * Determine the next value which will be used to draw the character's position on screen
   * @param {number} interp - The percentage of the desired timestamp between frames
   * @param {('top'|'left')} prop - The css property to be changed
   * @param {({top: number, left: number})} oldPosition - Position during the previous frame
   * @param {({top: number, left: number})} position - Position during the current frame
   * @returns {number} - New value for css positioning
   */
  calculateNewDrawValue(interp, prop, oldPosition, position) {
    return oldPosition[prop] + (position[prop] - oldPosition[prop]) * interp;
  }

  /**
   * Convert the character's css position to a row-column on the maze array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({x: number, y: number})}
   */
  determineGridPosition(position, scaledTileSize) {
    return {
      x: (position.left / scaledTileSize) + 0.5,
      y: (position.top / scaledTileSize) + 0.5,
    };
  }

  /**
   * Check to see if a character's desired direction results in turning around
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('up'|'down'|'left'|'right')} desiredDirection - Character's desired orientation
   * @returns {boolean}
   */
  turningAround(direction, desiredDirection) {
    return desiredDirection === this.getOppositeDirection(direction);
  }

  /**
   * Calculate the opposite of a given direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {('up'|'down'|'left'|'right')}
   */
  getOppositeDirection(direction) {
    switch (direction) {
      case this.directions.up:
        return this.directions.down;
      case this.directions.down:
        return this.directions.up;
      case this.directions.left:
        return this.directions.right;
      default:
        return this.directions.left;
    }
  }

  /**
   * Calculate the proper rounding function to assist with collision detection
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {Function}
   */
  determineRoundingFunction(direction) {
    switch (direction) {
      case this.directions.up:
      case this.directions.left:
        return Math.floor;
      default:
        return Math.ceil;
    }
  }

  /**
   * Check to see if the character's next frame results in moving to a new tile on the maze array
   * @param {({x: number, y: number})} oldPosition - Position during the previous frame
   * @param {({x: number, y: number})} position - Position during the current frame
   * @returns {boolean}
   */
  changingGridPosition(oldPosition, position) {
    return (
      Math.floor(oldPosition.x) !== Math.floor(position.x)
            || Math.floor(oldPosition.y) !== Math.floor(position.y)
    );
  }

  /**
   * Check to see if the character is attempting to run into a wall of the maze
   * @param {({x: number, y: number})} desiredNewGridPosition - Character's target tile
   * @param {Array} mazeArray - The 2D array representing the game's maze
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @returns {boolean}
   */
  checkForWallCollision(desiredNewGridPosition, mazeArray, direction) {
    const roundingFunction = this.determineRoundingFunction(direction, this.directions);

    const desiredX = roundingFunction(desiredNewGridPosition.x);
    const desiredY = roundingFunction(desiredNewGridPosition.y);
    let newGridValue;

    if (Array.isArray(mazeArray[desiredY])) {
      newGridValue = mazeArray[desiredY][desiredX];
    }

    return (newGridValue === 'X');
  }

  /**
   * Returns an object containing the new position and grid position based upon a direction
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} velocityPerMs - The distance to travel in a single millisecond
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {object}
   */
  determineNewPositions(position, direction, velocityPerMs, elapsedMs, scaledTileSize) {
    const newPosition = { ...position };
    newPosition[this.getPropertyToChange(direction)]
      += this.getVelocity(direction, velocityPerMs) * elapsedMs;
    const newGridPosition = this.determineGridPosition(newPosition, scaledTileSize);

    return {
      newPosition,
      newGridPosition,
    };
  }

  /**
   * Calculates the css position when snapping the character to the x-y grid
   * @param {({x: number, y: number})} position - The character's position during the current frame
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  snapToGrid(position, direction, scaledTileSize) {
    const newPosition = { ...position };
    const roundingFunction = this.determineRoundingFunction(direction, this.directions);

    switch (direction) {
      case this.directions.up:
      case this.directions.down:
        newPosition.y = roundingFunction(newPosition.y);
        break;
      default:
        newPosition.x = roundingFunction(newPosition.x);
        break;
    }

    return {
      top: (newPosition.y - 0.5) * scaledTileSize,
      left: (newPosition.x - 0.5) * scaledTileSize,
    };
  }

  /**
   * Returns a modified position if the character needs to warp
   * @param {({top: number, left: number})} position - css position during the current frame
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @returns {({top: number, left: number})}
   */
  handleWarp(position, scaledTileSize, mazeArray) {
    const newPosition = { ...position };
    const gridPosition = this.determineGridPosition(position, scaledTileSize);

    if (gridPosition.x < -0.75) {
      newPosition.left = (scaledTileSize * (mazeArray[0].length - 0.75));
    } else if (gridPosition.x > (mazeArray[0].length - 0.25)) {
      newPosition.left = (scaledTileSize * -1.25);
    }

    return newPosition;
  }

  /**
   * Advances spritesheet by one frame if needed
   * @param {Object} character - The character which needs to be animated
   */
  advanceSpriteSheet(character) {
    const {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    } = character;
    const updatedProperties = {
      msSinceLastSprite,
      animationTarget,
      backgroundOffsetPixels,
    };

    const ready = (character.msSinceLastSprite > character.msBetweenSprites)
      && character.animate;
    if (ready) {
      updatedProperties.msSinceLastSprite = 0;

      if (character.backgroundOffsetPixels
        < (character.measurement * (character.spriteFrames - 1))
      ) {
        updatedProperties.backgroundOffsetPixels += character.measurement;
      } else if (character.loopAnimation) {
        updatedProperties.backgroundOffsetPixels = 0;
      }

      const style = `-${updatedProperties.backgroundOffsetPixels}px 0px`;
      updatedProperties.animationTarget.style.backgroundPosition = style;
    }

    return updatedProperties;
  }
}


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


class SoundManager {
  constructor() {
    this.baseUrl = 'app/style/audio/';
    this.fileFormat = 'mp3';
    this.masterVolume = 1;
    this.paused = false;
    this.cutscene = true;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ambience = new AudioContext();

    // Dedicated AudioContext for dot sounds (mobile optimization)
    this.dotContext = new AudioContext();
    this.dotGain = this.dotContext.createGain();
    this.dotGain.gain.value = 1;
    this.dotGain.connect(this.dotContext.destination);

    // Pre-load dot sound buffers
    this.dotBuffers = {};
    this.initializeDotSounds();

    // Dot sound state
    this.dotSound = 0; // Will alternate between 1 and 2
    this.queuedDotSound = false;
    this.dotPlayerActive = false;
  }

  /**
   * Pre-loads both dot sound buffers for instant playback
   */
  async initializeDotSounds() {
    const [response1, response2] = await Promise.all([
      fetch(`${this.baseUrl}dot_1.${this.fileFormat}`),
      fetch(`${this.baseUrl}dot_2.${this.fileFormat}`),
    ]);

    const [arrayBuffer1, arrayBuffer2] = await Promise.all([
      response1.arrayBuffer(),
      response2.arrayBuffer(),
    ]);

    const [audioBuffer1, audioBuffer2] = await Promise.all([
      this.dotContext.decodeAudioData(arrayBuffer1),
      this.dotContext.decodeAudioData(arrayBuffer2),
    ]);

    this.dotBuffers[1] = audioBuffer1;
    this.dotBuffers[2] = audioBuffer2;
  }

  /**
   * Sets the cutscene flag to determine if players should be able to resume ambience
   * @param {Boolean} newValue
   */
  setCutscene(newValue) {
    this.cutscene = newValue;
  }

  /**
   * Sets the master volume for all sounds and stops/resumes ambience
   * @param {(0|1)} newVolume
   */
  setMasterVolume(newVolume) {
    this.masterVolume = newVolume;

    if (this.soundEffect) {
      this.soundEffect.volume = this.masterVolume;
    }

    // Update dot sound gain
    if (this.dotGain) {
      this.dotGain.gain.value = this.masterVolume;
    }

    if (this.masterVolume === 0) {
      this.stopAmbience();
    } else {
      this.resumeAmbience(this.paused);
    }
  }

  /**
   * Plays a single sound effect
   * @param {String} sound
   */
  play(sound) {
    this.soundEffect = new Audio(`${this.baseUrl}${sound}.${this.fileFormat}`);
    this.soundEffect.volume = this.masterVolume;
    this.soundEffect.play();
  }

  /**
   * Special method for eating dots. The dots should alternate between two
   * sound effects, but not too quickly. Uses pre-loaded AudioBuffers for
   * instant playback on mobile.
   */
  playDotSound() {
    this.queuedDotSound = true;

    if (!this.dotPlayerActive && this.dotBuffers[1] && this.dotBuffers[2]) {
      this.queuedDotSound = false;
      this.dotPlayerActive = true;

      // Alternate between dot sounds
      this.dotSound = (this.dotSound === 1) ? 2 : 1;

      // Create a new BufferSourceNode (cheap operation)
      const source = this.dotContext.createBufferSource();
      source.buffer = this.dotBuffers[this.dotSound];
      source.connect(this.dotGain);

      // Play immediately
      source.start(0);

      // Use setTimeout with buffer duration + 100ms gap to preserve "wa ka" timing
      const { duration } = this.dotBuffers[this.dotSound];
      setTimeout(() => {
        this.dotSoundEnded();
      }, (duration * 1000) + 100);
    }
  }

  /**
   * Called when a dot sound finishes playing. Plays another dot sound if queued.
   */
  dotSoundEnded() {
    this.dotPlayerActive = false;

    if (this.queuedDotSound) {
      this.playDotSound();
    }
  }

  /**
   * Loops an ambient sound
   * @param {String} sound
   */
  async setAmbience(sound, keepCurrentAmbience) {
    if (!this.fetchingAmbience && !this.cutscene) {
      if (!keepCurrentAmbience) {
        this.currentAmbience = sound;
        this.paused = false;
      } else {
        this.paused = true;
      }

      if (this.ambienceSource) {
        this.ambienceSource.stop();
      }

      if (this.masterVolume !== 0) {
        this.fetchingAmbience = true;
        const response = await fetch(
          `${this.baseUrl}${sound}.${this.fileFormat}`,
        );
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ambience.decodeAudioData(arrayBuffer);

        this.ambienceSource = this.ambience.createBufferSource();
        this.ambienceSource.buffer = audioBuffer;
        this.ambienceSource.connect(this.ambience.destination);
        this.ambienceSource.loop = true;
        this.ambienceSource.start();

        this.fetchingAmbience = false;
      }
    }
  }

  /**
   * Resumes the ambience
   */
  resumeAmbience(paused) {
    if (this.ambienceSource) {
      // Resetting the ambience since an AudioBufferSourceNode can only
      // have 'start()' called once
      if (paused) {
        this.setAmbience('pause_beat', true);
      } else {
        this.setAmbience(this.currentAmbience);
      }
    }
  }

  /**
   * Stops the ambience
   */
  stopAmbience() {
    if (this.ambienceSource) {
      this.ambienceSource.stop();
    }
  }
}


class Timer {
  constructor(callback, delay) {
    this.callback = callback;
    this.remaining = delay;
    this.resume();
  }

  /**
   * Pauses the timer marks whether the pause came from the player
   * or the system
   * @param {Boolean} systemPause
   */
  pause(systemPause) {
    window.clearTimeout(this.timerId);
    this.remaining -= new Date() - this.start;
    this.oldTimerId = this.timerId;

    if (systemPause) {
      this.pausedBySystem = true;
    }
  }

  /**
   * Creates a new setTimeout based upon the remaining time, giving the
   * illusion of 'resuming' the old setTimeout
   * @param {Boolean} systemResume
   */
  resume(systemResume) {
    if (systemResume || !this.pausedBySystem) {
      this.pausedBySystem = false;

      this.start = new Date();
      this.timerId = window.setTimeout(() => {
        this.callback();
        window.dispatchEvent(new CustomEvent('removeTimer', {
          detail: {
            timer: this,
          },
        }));
      }, this.remaining);

      if (!this.oldTimerId) {
        window.dispatchEvent(new CustomEvent('addTimer', {
          detail: {
            timer: this,
          },
        }));
      }
    }
  }
}


class Ghost {
  constructor(scaledTileSize, mazeArray, pacman, name, level, characterUtil, blinky) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = mazeArray;
    this.pacman = pacman;
    this.name = name;
    this.level = level;
    this.characterUtil = characterUtil;
    this.blinky = blinky;
    this.animationTarget = document.getElementById(name);

    this.reset();
  }

  /**
   * Rests the character to its default state
   * @param {Boolean} fullGameReset
   */
  reset(fullGameReset) {
    if (fullGameReset) {
      delete this.defaultSpeed;
      delete this.cruiseElroy;
    }

    this.setDefaultMode();
    this.setMovementStats(this.pacman, this.name, this.level);
    this.setSpriteAnimationStats();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.setDefaultPosition(this.scaledTileSize, this.name);
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the default mode and idleMode behavior
   */
  setDefaultMode() {
    this.allowCollision = true;
    this.defaultMode = 'scatter';
    this.mode = 'scatter';
    delete this.visualState;
    if (this.name !== 'blinky') {
      this.idleMode = 'idle';
    }
  }

  /**
   * Sets various properties related to the ghost's movement
   * @param {Object} pacman - Pacman's speed is used as the base for the ghosts' speeds
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   */
  setMovementStats(pacman, name, level) {
    const pacmanSpeed = pacman.velocityPerMs;
    const levelAdjustment = level / 100;

    this.slowSpeed = pacmanSpeed * (0.75 + levelAdjustment);
    this.mediumSpeed = pacmanSpeed * (0.875 + levelAdjustment);
    this.fastSpeed = pacmanSpeed * (1 + levelAdjustment);

    if (!this.defaultSpeed) {
      this.defaultSpeed = this.slowSpeed;
    }

    this.scaredSpeed = pacmanSpeed * 0.5;
    this.transitionSpeed = pacmanSpeed * 0.4;
    this.eyeSpeed = pacmanSpeed * 2;

    this.velocityPerMs = this.defaultSpeed;
    this.moving = false;

    switch (name) {
      case 'blinky':
        this.defaultDirection = this.characterUtil.directions.left;
        break;
      case 'pinky':
        this.defaultDirection = this.characterUtil.directions.down;
        break;
      case 'inky':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      case 'clyde':
        this.defaultDirection = this.characterUtil.directions.up;
        break;
      default:
        this.defaultDirection = this.characterUtil.directions.left;
        break;
    }
    this.direction = this.defaultDirection;
  }

  /**
   * Sets values pertaining to the ghost's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.display = true;
    this.loopAnimation = true;
    this.animate = true;
    this.msBetweenSprites = 250;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 2;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Sets css property values for the ghost
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in the ghost's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    // The ghosts are the size of 2x2 game tiles.
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    const bgSize = this.measurement * spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
  }

  /**
   * Sets the default position and direction for the ghosts at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   */
  setDefaultPosition(scaledTileSize, name) {
    switch (name) {
      case 'blinky':
        this.defaultPosition = {
          top: scaledTileSize * 10.5,
          left: scaledTileSize * 13,
        };
        break;
      case 'pinky':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 13,
        };
        break;
      case 'inky':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 11,
        };
        break;
      case 'clyde':
        this.defaultPosition = {
          top: scaledTileSize * 13.5,
          left: scaledTileSize * 15,
        };
        break;
      default:
        this.defaultPosition = {
          top: 0,
          left: 0,
        };
        break;
    }
    this.position = { ...this.defaultPosition };
    this.oldPosition = { ...this.position };
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   */
  setSpriteSheet(name, direction, mode) {
    if (this.visualState === 'caught') {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + 'spriteSheets/characters/ghosts/cash/cash_red.svg)';
    } else if (mode === 'eyes') {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/eyes_${direction}.svg)`;
    } else if (this.visualState === 'paymentCard') {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + 'spriteSheets/characters/ghosts/cash/cash_card.svg)';
    } else {
      this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/characters/ghosts/cash/cash_${direction}.svg)`;
    }
  }

  /**
   * Checks to see if the ghost is currently in the 'tunnels' on the outer edges of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInTunnel(gridPosition) {
    return (
      gridPosition.y === 14
      && (gridPosition.x < 6 || gridPosition.x > 21)
    );
  }

  /**
   * Checks to see if the ghost is currently in the 'Ghost House' in the center of the maze
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @returns {Boolean}
   */
  isInGhostHouse(gridPosition) {
    return (
      (gridPosition.x > 9 && gridPosition.x < 18)
      && (gridPosition.y > 11 && gridPosition.y < 17)
    );
  }

  /**
   * Checks to see if the tile at the given coordinates of the Maze is an open position
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {number} y - The target row
   * @param {number} x - The target column
   * @returns {(false | { x: number, y: number})} - x-y pair if the tile is free, false otherwise
   */
  getTile(mazeArray, y, x) {
    let tile = false;

    if (mazeArray[y] && mazeArray[y][x] && mazeArray[y][x] !== 'X') {
      tile = {
        x,
        y,
      };
    }

    return tile;
  }

  /**
   * Returns a list of all of the possible moves for the ghost to make on the next turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @returns {object}
   */
  determinePossibleMoves(gridPosition, direction, mazeArray) {
    const { x, y } = gridPosition;

    const possibleMoves = {
      up: this.getTile(mazeArray, y - 1, x),
      down: this.getTile(mazeArray, y + 1, x),
      left: this.getTile(mazeArray, y, x - 1),
      right: this.getTile(mazeArray, y, x + 1),
    };

    // Ghosts are not allowed to turn around at crossroads
    possibleMoves[this.characterUtil.getOppositeDirection(direction)] = false;

    Object.keys(possibleMoves).forEach((tile) => {
      if (possibleMoves[tile] === false) {
        delete possibleMoves[tile];
      }
    });

    return possibleMoves;
  }

  /**
   * Uses the Pythagorean Theorem to measure the distance between a given postion and Pacman
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacman - Pacman's current x-y position on the 2D Maze Array
   * @returns {number}
   */
  calculateDistance(position, pacman) {
    return Math.sqrt(
      ((position.x - pacman.x) ** 2) + ((position.y - pacman.y) ** 2),
    );
  }

  /**
   * Gets a position a number of spaces in front of Pacman's direction
   * @param {({x: number, y: number})} pacmanGridPosition
   * @param {number} spaces
   */
  getPositionInFrontOfPacman(pacmanGridPosition, spaces) {
    const target = { ...pacmanGridPosition };
    const pacDirection = this.pacman.direction;
    const propToChange = (pacDirection === 'up' || pacDirection === 'down')
      ? 'y' : 'x';
    const tileOffset = (pacDirection === 'up' || pacDirection === 'left')
      ? (spaces * -1) : spaces;
    target[propToChange] += tileOffset;

    return target;
  }

  /**
   * Determines Pinky's target, which is four tiles in front of Pacman's direction
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determinePinkyTarget(pacmanGridPosition) {
    return this.getPositionInFrontOfPacman(pacmanGridPosition, 4);
  }

  /**
   * Determines Inky's target, which is a mirror image of Blinky's position
   * reflected across a point two tiles in front of Pacman's direction.
   * Example @ app\style\graphics\spriteSheets\references\inky_target.png
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineInkyTarget(pacmanGridPosition) {
    const blinkyGridPosition = this.characterUtil.determineGridPosition(this.blinky.position, this.scaledTileSize);
    const pivotPoint = this.getPositionInFrontOfPacman(pacmanGridPosition, 2);
    return {
      x: pivotPoint.x + (pivotPoint.x - blinkyGridPosition.x),
      y: pivotPoint.y + (pivotPoint.y - blinkyGridPosition.y),
    };
  }

  /**
   * Clyde targets Pacman when the two are far apart, but retreats to the
   * lower-left corner when the two are within eight tiles of each other
   * @param {({x: number, y: number})} gridPosition
   * @param {({x: number, y: number})} pacmanGridPosition
   * @returns {({x: number, y: number})}
   */
  determineClydeTarget(gridPosition, pacmanGridPosition) {
    const distance = this.calculateDistance(gridPosition, pacmanGridPosition);
    return (distance > 8) ? pacmanGridPosition : { x: 0, y: 30 };
  }

  /**
   * Determines the appropriate target for the ghost's AI
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {({x: number, y: number})}
   */
  getTarget(name, gridPosition, pacmanGridPosition, mode) {
    // Ghosts return to the ghost-house after eaten
    if (mode === 'eyes') {
      return { x: 13.5, y: 10 };
    }

    // Ghosts run from Pacman if scared
    if (mode === 'scared') {
      return pacmanGridPosition;
    }

    // Ghosts seek out corners in Scatter mode
    if (mode === 'scatter') {
      switch (name) {
        case 'blinky':
          // Blinky will chase Pacman, even in Scatter mode, if he's in Cruise Elroy form
          return (this.cruiseElroy ? pacmanGridPosition : { x: 27, y: 0 });
        case 'pinky':
          return { x: 0, y: 0 };
        case 'inky':
          return { x: 27, y: 30 };
        case 'clyde':
          return { x: 0, y: 30 };
        default:
          return { x: 0, y: 0 };
      }
    }

    switch (name) {
      // Blinky goes after Pacman's position
      case 'blinky':
        return pacmanGridPosition;
      case 'pinky':
        return this.determinePinkyTarget(pacmanGridPosition);
      case 'inky':
        return this.determineInkyTarget(pacmanGridPosition);
      case 'clyde':
        return this.determineClydeTarget(gridPosition, pacmanGridPosition);
      default:
        // TODO: Other ghosts
        return pacmanGridPosition;
    }
  }

  /**
   * Calls the appropriate function to determine the best move depending on the ghost's name
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {Object} possibleMoves - All of the moves the ghost could choose to make this turn
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineBestMove(name, possibleMoves, gridPosition, pacmanGridPosition, mode) {
    let bestDistance = (mode === 'scared') ? 0 : Infinity;
    let bestMove;
    const target = this.getTarget(name, gridPosition, pacmanGridPosition, mode);

    Object.keys(possibleMoves).forEach((move) => {
      const distance = this.calculateDistance(possibleMoves[move], target);
      const betterMove = (mode === 'scared')
        ? (distance > bestDistance)
        : (distance < bestDistance);

      if (betterMove) {
        bestDistance = distance;
        bestMove = move;
      }
    });

    return bestMove;
  }

  /**
   * Determines the best direction for the ghost to travel in during the current frame
   * @param {('inky'|'blinky'|'pinky'|'clyde')} name - The name of the current ghost
   * @param {({x: number, y: number})} gridPosition - The current x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {('up'|'down'|'left'|'right')}
   */
  determineDirection(name, gridPosition, pacmanGridPosition, direction, mazeArray, mode) {
    let newDirection = direction;
    const possibleMoves = this.determinePossibleMoves(gridPosition, direction, mazeArray);

    if (Object.keys(possibleMoves).length === 1) {
      [newDirection] = Object.keys(possibleMoves);
    } else if (Object.keys(possibleMoves).length > 1) {
      newDirection = this.determineBestMove(name, possibleMoves, gridPosition, pacmanGridPosition, mode);
    }

    return newDirection;
  }

  /**
   * Handles movement for idle Ghosts in the Ghost House
   * @param {*} elapsedMs
   * @param {*} position
   * @param {*} velocity
   * @returns {({ top: number, left: number})}
   */
  handleIdleMovement(elapsedMs, position, velocity) {
    const newPosition = { ...this.position };

    if (position.y <= 13.5) {
      this.direction = this.characterUtil.directions.down;
    } else if (position.y >= 14.5) {
      this.direction = this.characterUtil.directions.up;
    }

    if (this.idleMode === 'leaving') {
      if (position.x === 13.5 && (position.y > 10.8 && position.y < 11)) {
        this.idleMode = undefined;
        newPosition.top = this.scaledTileSize * 10.5;
        this.direction = this.characterUtil.directions.left;
        window.dispatchEvent(new Event('releaseGhost'));
      } else if (position.x > 13.4 && position.x < 13.6) {
        newPosition.left = this.scaledTileSize * 13;
        this.direction = this.characterUtil.directions.up;
      } else if (position.y > 13.9 && position.y < 14.1) {
        newPosition.top = this.scaledTileSize * 13.5;
        this.direction = (position.x < 13.5)
          ? this.characterUtil.directions.right
          : this.characterUtil.directions.left;
      }
    }

    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;

    return newPosition;
  }

  /**
   * Sets idleMode to 'leaving', allowing the ghost to leave the Ghost House
   */
  endIdleMode() {
    this.idleMode = 'leaving';
  }

  /**
   * Handle the ghost's movement when it is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @param {({x: number, y: number})} pacmanGridPosition - x-y position on the 2D Maze Array
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs, gridPosition, velocity, pacmanGridPosition) {
    const newPosition = { ...this.position };

    this.direction = this.determineDirection(
      this.name,
      gridPosition,
      pacmanGridPosition,
      this.direction,
      this.mazeArray,
      this.mode,
    );
    newPosition[this.characterUtil.getPropertyToChange(this.direction)]
      += this.characterUtil.getVelocity(this.direction, velocity) * elapsedMs;

    return newPosition;
  }

  /**
   * Determines if an eaten ghost is at the entrance of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteringGhostHouse(mode, position) {
    return (
      mode === 'eyes'
      && position.y === 11
      && (position.x > 13.4 && position.x < 13.6)
    );
  }

  /**
   * Determines if an eaten ghost has reached the center of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  enteredGhostHouse(mode, position) {
    return (
      mode === 'eyes'
      && position.x === 13.5
      && (position.y > 13.8 && position.y < 14.2)
    );
  }

  /**
   * Determines if a restored ghost is at the exit of the Ghost House
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @param {({x: number, y: number})} position - x-y position during the current frame
   * @returns {Boolean}
   */
  leavingGhostHouse(mode, position) {
    return (
      mode !== 'eyes'
      && position.x === 13.5
      && (position.y > 10.8 && position.y < 11)
    );
  }

  /**
   * Handles entering and leaving the Ghost House after a ghost is eaten
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @returns {({x: number, y: number})}
   */
  handleGhostHouse(gridPosition) {
    const gridPositionCopy = { ...gridPosition };

    if (this.enteringGhostHouse(this.mode, gridPosition)) {
      this.direction = this.characterUtil.directions.down;
      gridPositionCopy.x = 13.5;
      this.position = this.characterUtil.snapToGrid(gridPositionCopy, this.direction, this.scaledTileSize);
    }

    if (this.enteredGhostHouse(this.mode, gridPosition)) {
      this.direction = this.characterUtil.directions.up;
      gridPositionCopy.y = 14;
      this.position = this.characterUtil.snapToGrid(gridPositionCopy, this.direction, this.scaledTileSize);
      this.mode = this.defaultMode;
      window.dispatchEvent(new Event('restoreGhost'));
    }

    if (this.leavingGhostHouse(this.mode, gridPosition)) {
      gridPositionCopy.y = 11;
      this.position = this.characterUtil.snapToGrid(gridPositionCopy, this.direction, this.scaledTileSize);
      this.direction = this.characterUtil.directions.left;
    }

    return gridPositionCopy;
  }

  /**
   * Handle the ghost's movement when it is inbetween tiles on the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} velocity - The distance the character should travel in a single millisecond
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(elapsedMs, gridPosition, velocity) {
    const gridPositionCopy = this.handleGhostHouse(gridPosition);

    const desired = this.characterUtil.determineNewPositions(
      this.position,
      this.direction,
      velocity,
      elapsedMs,
      this.scaledTileSize,
    );

    if (this.characterUtil.changingGridPosition(gridPositionCopy, desired.newGridPosition)) {
      return this.characterUtil.snapToGrid(gridPositionCopy, this.direction, this.scaledTileSize);
    }

    return desired.newPosition;
  }

  /**
   * Determines the new Ghost position
   * @param {number} elapsedMs
   * @returns {({ top: number, left: number})}
   */
  handleMovement(elapsedMs) {
    let newPosition;

    const gridPosition = this.characterUtil.determineGridPosition(this.position, this.scaledTileSize);
    const pacmanGridPosition = this.characterUtil.determineGridPosition(this.pacman.position, this.scaledTileSize);
    const velocity = this.determineVelocity(gridPosition, this.mode);

    if (this.idleMode) {
      newPosition = this.handleIdleMovement(elapsedMs, gridPosition, velocity);
    } else if (JSON.stringify(this.position) === JSON.stringify(
      this.characterUtil.snapToGrid(gridPosition, this.direction, this.scaledTileSize),
    )) {
      newPosition = this.handleSnappedMovement(elapsedMs, gridPosition, velocity, pacmanGridPosition);
    } else {
      newPosition = this.handleUnsnappedMovement(elapsedMs, gridPosition, velocity);
    }

    newPosition = this.characterUtil.handleWarp(newPosition, this.scaledTileSize, this.mazeArray);

    this.checkCollision(gridPosition, pacmanGridPosition);

    return newPosition;
  }

  /**
   * Changes the defaultMode to chase or scatter, and turns the ghost around
   * if needed
   * @param {('chase'|'scatter')} newMode
   */
  changeMode(newMode) {
    this.defaultMode = newMode;

    const gridPosition = this.characterUtil.determineGridPosition(this.position, this.scaledTileSize);

    if ((this.mode === 'chase' || this.mode === 'scatter')
      && !this.cruiseElroy) {
      this.mode = newMode;

      if (!this.isInGhostHouse(gridPosition)) {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
    }
  }

  /**
   * Toggles a scared ghost between blue and white, then updates its spritsheet
   */
  toggleScaredColor() {
    this.scaredColor = (this.scaredColor === 'blue')
      ? 'white' : 'blue';
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets the ghost's mode to SCARED, turns the ghost around,
   * and changes spritesheets accordingly
   */
  becomeScared() {
    const gridPosition = this.characterUtil.determineGridPosition(this.position, this.scaledTileSize);

    if (this.mode !== 'eyes') {
      if (!this.isInGhostHouse(gridPosition) && this.mode !== 'scared') {
        this.direction = this.characterUtil.getOppositeDirection(
          this.direction,
        );
      }
      this.mode = 'scared';
      this.scaredColor = 'blue';
      this.setSpriteSheet(this.name, this.direction, this.mode);
    }
  }

  /**
   * Shows the red cash sprite while Pacman collects the caught ghost points.
   */
  setCaughtVisualState() {
    this.visualState = 'caught';
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Clears the temporary caught visual state and restores the current mode sprite.
   */
  clearCaughtVisualState() {
    delete this.visualState;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Shows the payment card sprite after points are collected.
   */
  setPaymentCardVisualState() {
    this.visualState = 'paymentCard';
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Clears the temporary payment card visual state.
   */
  clearPaymentCardVisualState() {
    if (this.visualState === 'paymentCard') {
      delete this.visualState;
      this.setSpriteSheet(this.name, this.direction, this.mode);
    }
  }

  /**
   * Returns the scared ghost to chase/scatter mode and sets its spritesheet
   */
  endScared() {
    this.mode = this.defaultMode;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Speeds up the ghost (used for Blinky as Pacdots are eaten)
   */
  speedUp() {
    this.cruiseElroy = true;

    if (this.defaultSpeed === this.slowSpeed) {
      this.defaultSpeed = this.mediumSpeed;
    } else if (this.defaultSpeed === this.mediumSpeed) {
      this.defaultSpeed = this.fastSpeed;
    }
  }

  /**
   * Resets defaultSpeed to slow and updates the spritesheet
   */
  resetDefaultSpeed() {
    this.defaultSpeed = this.slowSpeed;
    this.cruiseElroy = false;
    this.setSpriteSheet(this.name, this.direction, this.mode);
  }

  /**
   * Sets a flag to indicate when the ghost should pause its movement
   * @param {Boolean} newValue
   */
  pause(newValue) {
    this.paused = newValue;
  }

  /**
   * Checks if the ghost contacts Pacman - starts the death sequence if so
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {({x: number, y: number})} pacman - Pacman's current x-y position on the 2D Maze Array
   */
  checkCollision(position, pacman) {
    if (this.calculateDistance(position, pacman) < 1
      && this.mode !== 'eyes'
      && this.allowCollision) {
      if (this.mode === 'scared') {
        this.setCaughtVisualState();
        window.dispatchEvent(new CustomEvent('eatGhost', {
          detail: {
            ghost: this,
          },
        }));
        this.mode = 'eyes';
      } else {
        window.dispatchEvent(new Event('deathSequence'));
      }
    }
  }

  /**
   * Determines the appropriate speed for the ghost
   * @param {({x: number, y: number})} position - An x-y position on the 2D Maze Array
   * @param {('chase'|'scatter'|'scared'|'eyes')} mode - The character's behavior mode
   * @returns {number}
   */
  determineVelocity(position, mode) {
    if (mode === 'eyes') {
      return this.eyeSpeed;
    }

    if (this.paused) {
      return 0;
    }

    if (this.isInTunnel(position) || this.isInGhostHouse(position)) {
      return this.transitionSpeed;
    }

    if (mode === 'scared') {
      return this.scaredSpeed;
    }

    return this.defaultSpeed;
  }

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    const newTop = this.characterUtil.calculateNewDrawValue(interp, 'top', this.oldPosition, this.position);
    const newLeft = this.characterUtil.calculateNewDrawValue(interp, 'left', this.oldPosition, this.position);
    this.animationTarget.style.top = `${newTop}px`;
    this.animationTarget.style.left = `${newLeft}px`;

    this.animationTarget.style.visibility = this.display
      ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
      : 'hidden';

    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
  }

  /**
   * Handles movement logic for the ghost
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = { ...this.position };

    if (this.moving) {
      this.position = this.handleMovement(elapsedMs);
      this.setSpriteSheet(this.name, this.direction, this.mode);
      this.msSinceLastSprite += elapsedMs;
    }
  }
}


class Pacman {
  constructor(scaledTileSize, mazeArray, characterUtil) {
    this.scaledTileSize = scaledTileSize;
    this.mazeArray = mazeArray;
    this.characterUtil = characterUtil;
    this.animationTarget = document.getElementById('pacman');
    this.pacmanArrow = document.getElementById('pacman-arrow');

    this.reset();
  }

  /**
   * Rests the character to its default state
   */
  reset() {
    this.setMovementStats(this.scaledTileSize);
    this.setSpriteAnimationStats();
    this.deactivateContactlessMode();
    this.setStyleMeasurements(this.scaledTileSize, this.spriteFrames);
    this.setDefaultPosition(this.scaledTileSize);
    this.setSpriteSheet(this.direction);
    this.pacmanArrow.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/arrow_${this.direction}.svg)`;
  }

  /**
   * Sets various properties related to Pacman's movement
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setMovementStats(scaledTileSize) {
    this.velocityPerMs = this.calculateVelocityPerMs(scaledTileSize);
    this.desiredDirection = this.characterUtil.directions.left;
    this.direction = this.characterUtil.directions.left;
    this.moving = false;
  }

  /**
   * Sets values pertaining to Pacman's spritesheet animation
   */
  setSpriteAnimationStats() {
    this.specialAnimation = false;
    this.display = true;
    this.animate = true;
    this.loopAnimation = true;
    this.msBetweenSprites = 50;
    this.msSinceLastSprite = 0;
    this.spriteFrames = 4;
    this.backgroundOffsetPixels = 0;
    this.animationTarget.style.backgroundPosition = '0px 0px';
  }

  /**
   * Enables Contactless Mode for automatically collecting nearby pacdots
   * @param {number} radius - CSS pixel radius for the Contactless effect
   */
  activateContactlessMode(radius) {
    this.contactlessRadius = radius;

    if (this.animationTarget.classList) {
      this.animationTarget.classList.add('contactless-mode');
    }
  }

  /**
   * Disables Contactless Mode and removes its visual treatment
   */
  deactivateContactlessMode() {
    this.contactlessRadius = 0;

    if (this.animationTarget.classList) {
      this.animationTarget.classList.remove('contactless-mode');
    }
  }

  /**
   * Sets css property values for Pacman and Pacman's Arrow
   * @param {number} scaledTileSize - The dimensions of a single tile
   * @param {number} spriteFrames - The number of frames in Pacman's spritesheet
   */
  setStyleMeasurements(scaledTileSize, spriteFrames) {
    this.measurement = scaledTileSize * 2;

    this.animationTarget.style.height = `${this.measurement}px`;
    this.animationTarget.style.width = `${this.measurement}px`;
    this.animationTarget.style.backgroundSize = `${
      this.measurement * spriteFrames
    }px`;

    this.pacmanArrow.style.height = `${this.measurement * 2}px`;
    this.pacmanArrow.style.width = `${this.measurement * 2}px`;
    this.pacmanArrow.style.backgroundSize = `${this.measurement * 2}px`;
  }

  /**
   * Sets the default position and direction for Pacman at the game's start
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  setDefaultPosition(scaledTileSize) {
    this.defaultPosition = {
      top: scaledTileSize * 22.5,
      left: scaledTileSize * 13,
    };
    this.position = { ...this.defaultPosition };
    this.oldPosition = { ...this.position };
    this.animationTarget.style.top = `${this.position.top}px`;
    this.animationTarget.style.left = `${this.position.left}px`;
  }

  /**
   * Calculates how fast Pacman should move in a millisecond
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  calculateVelocityPerMs(scaledTileSize) {
    // In the original game, Pacman moved at 11 tiles per second.
    const velocityPerSecond = scaledTileSize * 11;
    return velocityPerSecond / 1000;
  }

  /**
   * Chooses a movement Spritesheet depending upon direction
   * @param {('up'|'down'|'left'|'right')} direction - The character's current travel orientation
   */
  setSpriteSheet(direction) {
    this.animationTarget.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/mini_pos_${direction}.svg)`;
  }

  prepDeathAnimation() {
    this.loopAnimation = false;
    this.msBetweenSprites = 125;
    this.spriteFrames = 12;
    this.specialAnimation = true;
    this.backgroundOffsetPixels = 0;
    const bgSize = this.measurement * this.spriteFrames;
    this.animationTarget.style.backgroundSize = `${bgSize}px`;
    this.animationTarget.style.backgroundImage = 'url(app/style/'
      + 'graphics/spriteSheets/characters/pacman/mini_pos_declined.svg)';
    this.animationTarget.style.backgroundPosition = '0px 0px';
    this.pacmanArrow.style.backgroundImage = '';
  }

  /**
   * Changes Pacman's desiredDirection, updates the PacmanArrow sprite, and sets moving to true
   * @param {Event} e - The keydown event to evaluate
   * @param {Boolean} startMoving - If true, Pacman will move upon key press
   */
  changeDirection(newDirection, startMoving) {
    this.desiredDirection = newDirection;
    this.pacmanArrow.style.backgroundImage = 'url(app/style/graphics/'
      + `spriteSheets/characters/pacman/arrow_${this.desiredDirection}.svg)`;

    if (startMoving) {
      this.moving = true;
    }
  }

  /**
   * Updates the position of the leading arrow in front of Pacman
   * @param {({top: number, left: number})} position - Pacman's position during the current frame
   * @param {number} scaledTileSize - The dimensions of a single tile
   */
  updatePacmanArrowPosition(position, scaledTileSize) {
    this.pacmanArrow.style.top = `${position.top - scaledTileSize}px`;
    this.pacmanArrow.style.left = `${position.left - scaledTileSize}px`;
  }

  /**
   * Handle Pacman's movement when he is snapped to the x-y grid of the Maze Array
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleSnappedMovement(elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position,
      this.desiredDirection,
      this.velocityPerMs,
      elapsedMs,
      this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position,
      this.direction,
      this.velocityPerMs,
      elapsedMs,
      this.scaledTileSize,
    );

    if (this.characterUtil.checkForWallCollision(desired.newGridPosition, this.mazeArray, this.desiredDirection)) {
      if (this.characterUtil.checkForWallCollision(alternate.newGridPosition, this.mazeArray, this.direction)) {
        this.moving = false;
        return this.position;
      }
      return alternate.newPosition;
    }
    this.direction = this.desiredDirection;
    this.setSpriteSheet(this.direction);
    return desired.newPosition;
  }

  /**
   * Handle Pacman's movement when he is inbetween tiles on the x-y grid of the Maze Array
   * @param {({x: number, y: number})} gridPosition - x-y position during the current frame
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @returns {({ top: number, left: number})}
   */
  handleUnsnappedMovement(gridPosition, elapsedMs) {
    const desired = this.characterUtil.determineNewPositions(
      this.position,
      this.desiredDirection,
      this.velocityPerMs,
      elapsedMs,
      this.scaledTileSize,
    );
    const alternate = this.characterUtil.determineNewPositions(
      this.position,
      this.direction,
      this.velocityPerMs,
      elapsedMs,
      this.scaledTileSize,
    );

    if (this.characterUtil.turningAround(this.direction, this.desiredDirection)) {
      this.direction = this.desiredDirection;
      this.setSpriteSheet(this.direction);
      return desired.newPosition;
    } if (this.characterUtil.changingGridPosition(gridPosition, alternate.newGridPosition)) {
      return this.characterUtil.snapToGrid(gridPosition, this.direction, this.scaledTileSize);
    }
    return alternate.newPosition;
  }

  /**
   * Updates the css position, hides if there is a stutter, and animates the spritesheet
   * @param {number} interp - The animation accuracy as a percentage
   */
  draw(interp) {
    const newTop = this.characterUtil.calculateNewDrawValue(interp, 'top', this.oldPosition, this.position);
    const newLeft = this.characterUtil.calculateNewDrawValue(interp, 'left', this.oldPosition, this.position);
    this.animationTarget.style.top = `${newTop}px`;
    this.animationTarget.style.left = `${newLeft}px`;

    this.animationTarget.style.visibility = this.display
      ? this.characterUtil.checkForStutter(this.position, this.oldPosition)
      : 'hidden';
    this.pacmanArrow.style.visibility = this.animationTarget.style.visibility;

    this.updatePacmanArrowPosition(this.position, this.scaledTileSize);

    const updatedProperties = this.characterUtil.advanceSpriteSheet(this);
    this.msSinceLastSprite = updatedProperties.msSinceLastSprite;
    this.animationTarget = updatedProperties.animationTarget;
    this.backgroundOffsetPixels = updatedProperties.backgroundOffsetPixels;
  }

  /**
   * Handles movement logic for Pacman
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   */
  update(elapsedMs) {
    this.oldPosition = { ...this.position };

    if (this.moving) {
      const gridPosition = this.characterUtil.determineGridPosition(this.position, this.scaledTileSize);

      if (JSON.stringify(this.position) === JSON.stringify(
        this.characterUtil.snapToGrid(gridPosition, this.direction, this.scaledTileSize),
      )) {
        this.position = this.handleSnappedMovement(elapsedMs);
      } else {
        this.position = this.handleUnsnappedMovement(gridPosition, elapsedMs);
      }

      this.position = this.characterUtil.handleWarp(this.position, this.scaledTileSize, this.mazeArray);
    }

    if (this.moving || this.specialAnimation) {
      this.msSinceLastSprite += elapsedMs;
    }
  }
}


class Pickup {
  constructor(type, scaledTileSize, column, row, pacman, mazeDiv, points) {
    this.type = type;
    this.pacman = pacman;
    this.mazeDiv = mazeDiv;
    this.points = points;
    this.nearPacman = false;

    this.fruitImages = {
      100: 'card_contactless',
      300: 'card_coral',
      500: 'card_virtual',
      700: 'card_business',
      1000: 'token_secure',
      2000: 'token_premium',
      3000: 'token_black',
      5000: 'token_vault',
    };

    this.setStyleMeasurements(type, scaledTileSize, column, row, points);
  }

  /**
   * Resets the pickup's visibility
   */
  reset() {
    this.animationTarget.style.visibility = (
      this.type === 'fruit'
      || this.type === 'contactless'
      || this.type === 'otp'
    )
      ? 'hidden' : 'visible';
  }

  /**
   * Sets various style measurements for the pickup depending on its type
   * @param {('pacdot'|'powerPellet'|'fruit'|'contactless'|'otp')} type - The classification of pickup
   * @param {number} scaledTileSize
   * @param {number} column
   * @param {number} row
   * @param {number} points
   */
  setStyleMeasurements(type, scaledTileSize, column, row, points) {
    if (type === 'pacdot') {
      this.size = scaledTileSize * 0.25;
      this.x = (column * scaledTileSize) + ((scaledTileSize / 8) * 3);
      this.y = (row * scaledTileSize) + ((scaledTileSize / 8) * 3);
    } else if (type === 'powerPellet') {
      this.size = scaledTileSize;
      this.x = (column * scaledTileSize);
      this.y = (row * scaledTileSize);
    } else {
      this.size = scaledTileSize * 2;
      this.width = this.size;
      this.height = scaledTileSize * (4 / 3);
      this.x = (column * scaledTileSize) - (scaledTileSize * 0.5);
      this.y = (row * scaledTileSize) - (scaledTileSize * (1 / 6));
    }

    this.center = {
      x: column * scaledTileSize,
      y: row * scaledTileSize,
    };

    this.animationTarget = document.createElement('div');
    this.animationTarget.style.position = 'absolute';
    this.animationTarget.style.backgroundRepeat = 'no-repeat';
    this.animationTarget.style.backgroundSize = `${this.width || this.size}px ${this.height || this.size}px`;
    this.animationTarget.style.backgroundImage = this.determineImage(type, points);
    this.animationTarget.style.height = `${this.height || this.size}px`;
    this.animationTarget.style.width = `${this.width || this.size}px`;
    this.animationTarget.style.top = `${this.y}px`;
    this.animationTarget.style.left = `${this.x}px`;
    this.mazeDiv.appendChild(this.animationTarget);

    if (type === 'powerPellet') {
      this.animationTarget.classList.add('power-pellet');
    }

    this.reset();
  }

  /**
   * Determines the Pickup image based on type and point value
   * @param {('pacdot'|'powerPellet'|'fruit'|'contactless'|'otp')} type - The classification of pickup
   * @param {Number} points
   * @returns {String}
   */
  determineImage(type, points) {
    let image = '';

    if (type === 'fruit') {
      image = this.fruitImages[points] || 'card_contactless';
    } else if (type === 'powerPellet') {
      image = this.powerPelletVariant || 'power_card_blue';
    } else if (type === 'contactless') {
      image = 'card_contactless';
    } else if (type === 'otp') {
      return 'url(app/style/graphics/spriteSheets/pickups/otp.svg)';
    } else if (type === 'pacdot') {
      return 'url(app/style/graphics/spriteSheets/pickups/pacdot.svg)';
    } else {
      return 'url(app/style/graphics/spriteSheets/pickups/pacdot.svg)';
    }

    return `url(app/style/graphics/nexi/${image}.svg)`;
  }

  /**
   * Shows a bonus fruit, resetting its point value and image
   * @param {number} points
   */
  showFruit(points) {
    this.points = points;
    this.animationTarget.style.backgroundImage = this.determineImage(this.type, points);
    this.animationTarget.style.visibility = 'visible';
  }

  /**
   * Makes the fruit invisible (happens if Pacman was too slow)
   */
  hideFruit() {
    this.animationTarget.style.visibility = 'hidden';
  }

  /**
   * Shows the Contactless pickup at a maze coordinate
   * @param {number} column
   * @param {number} row
   * @param {number} scaledTileSize
   */
  showContactless(column, row, scaledTileSize) {
    this.size = scaledTileSize * 2;
    this.width = this.size;
    this.height = scaledTileSize * (4 / 3);
    this.x = (column * scaledTileSize) - (scaledTileSize * 0.5);
    this.y = (row * scaledTileSize) - (scaledTileSize * (1 / 6));
    this.center = {
      x: column * scaledTileSize,
      y: row * scaledTileSize,
    };

    this.animationTarget.style.backgroundImage = this.determineImage(this.type);
    this.animationTarget.style.backgroundSize = `${this.width}px ${this.height}px`;
    this.animationTarget.style.height = `${this.height}px`;
    this.animationTarget.style.width = `${this.width}px`;
    this.animationTarget.style.top = `${this.y}px`;
    this.animationTarget.style.left = `${this.x}px`;
    this.animationTarget.style.visibility = 'visible';
  }

  /**
   * Hides the Contactless pickup
   */
  hideContactless() {
    this.animationTarget.style.visibility = 'hidden';
  }

  /**
   * Shows the OTP pickup at a maze coordinate
   * @param {number} column
   * @param {number} row
   * @param {number} scaledTileSize
   */
  showOtp(column, row, scaledTileSize) {
    this.size = scaledTileSize * 2;
    this.width = this.size;
    this.height = scaledTileSize * (4 / 3);
    this.x = (column * scaledTileSize) - (scaledTileSize * 0.5);
    this.y = (row * scaledTileSize) - (scaledTileSize * (1 / 6));
    this.center = {
      x: column * scaledTileSize,
      y: row * scaledTileSize,
    };

    this.animationTarget.style.backgroundImage = this.determineImage(this.type);
    this.animationTarget.style.backgroundSize = `${this.width}px ${this.height}px`;
    this.animationTarget.style.height = `${this.height}px`;
    this.animationTarget.style.width = `${this.width}px`;
    this.animationTarget.style.top = `${this.y}px`;
    this.animationTarget.style.left = `${this.x}px`;
    this.animationTarget.style.visibility = 'visible';
  }

  /**
   * Hides the OTP pickup
   */
  hideOtp() {
    this.animationTarget.style.visibility = 'hidden';
  }

  /**
   * Returns true if the Pickup is touching a bounding box at Pacman's center
   * @param {({ x: number, y: number, size: number})} pickup
   * @param {({ x: number, y: number, size: number})} originalPacman
   */
  checkForCollision(pickup, originalPacman) {
    const pacman = { ...originalPacman };

    pacman.x += (pacman.size * 0.25);
    pacman.y += (pacman.size * 0.25);
    pacman.size /= 2;

    return (pickup.x < pacman.x + pacman.size
      && pickup.x + pickup.size > pacman.x
      && pickup.y < pacman.y + pacman.size
      && pickup.y + pickup.size > pacman.y);
  }

  /**
   * Checks to see if the pickup is close enough to Pacman to be considered for collision detection
   * @param {number} maxDistance - The maximum distance Pacman can travel per cycle
   * @param {({ x:number, y:number })} pacmanCenter - The center of Pacman's hitbox
   * @param {Boolean} debugging - Flag to change the appearance of pickups for testing
   */
  checkPacmanProximity(maxDistance, pacmanCenter, debugging) {
    if (this.animationTarget.style.visibility !== 'hidden') {
      const distance = Math.sqrt(
        ((this.center.x - pacmanCenter.x) ** 2)
        + ((this.center.y - pacmanCenter.y) ** 2),
      );

      this.nearPacman = (distance <= maxDistance);

      if (debugging) {
        this.animationTarget.style.background = this.nearPacman
          ? 'lime' : 'red';
      }
    }
  }

  /**
   * Checks if the pickup is visible and close to Pacman
   * @returns {Boolean}
   */
  shouldCheckForCollision() {
    return this.animationTarget.style.visibility !== 'hidden'
      && this.nearPacman;
  }

  /**
   * Checks if a pacdot is inside Pacman's active Contactless radius
   * @returns {Boolean}
   */
  shouldCollectContactless() {
    if (
      this.type !== 'pacdot'
      || this.animationTarget.style.visibility === 'hidden'
      || !this.pacman.contactlessRadius
    ) {
      return false;
    }

    const pacmanCenter = {
      x: this.pacman.position.left + (this.pacman.measurement / 2),
      y: this.pacman.position.top + (this.pacman.measurement / 2),
    };
    const distance = Math.sqrt(
      ((this.center.x - pacmanCenter.x) ** 2)
      + ((this.center.y - pacmanCenter.y) ** 2),
    );

    return distance <= this.pacman.contactlessRadius;
  }

  /**
   * Collects the pickup and emits the relevant game events
   */
  collect() {
    this.animationTarget.style.visibility = 'hidden';

    if (this.type === 'contactless') {
      window.dispatchEvent(new Event('contactlessMode'));
      return;
    }

    if (this.type === 'otp') {
      window.dispatchEvent(new Event('otpMode'));
      return;
    }

    if (!['fruit', 'pacdot', 'powerPellet'].includes(this.type)) {
      return;
    }

    window.dispatchEvent(new CustomEvent('awardPoints', {
      detail: {
        points: this.points,
        type: this.type,
      },
    }));

    if (this.type === 'pacdot') {
      window.dispatchEvent(new Event('dotEaten'));
    } else if (this.type === 'powerPellet') {
      window.dispatchEvent(new Event('dotEaten'));
      window.dispatchEvent(new Event('powerUp'));
    }
  }

  /**
   * If the Pickup is still visible, it checks to see if it is colliding with Pacman.
   * It will turn itself invisible and cease collision-detection after the first
   * collision with Pacman.
   */
  update() {
    const colliding = this.shouldCheckForCollision()
      && this.checkForCollision({
        x: this.x,
        y: this.y,
        size: this.size,
      }, {
        x: this.pacman.position.left,
        y: this.pacman.position.top,
        size: this.pacman.measurement,
      });

    if (colliding || this.shouldCollectContactless()) {
      this.collect();
    }
  }
}


class GameCoordinator {
  constructor() {
    this.gameUi = document.getElementById('game-ui');
    this.rowTop = document.getElementById('row-top');
    this.mazeDiv = document.getElementById('maze');
    this.mazeImg = document.getElementById('maze-img');
    this.mazeCover = document.getElementById('maze-cover');
    this.pointsDisplay = document.getElementById('points-display');
    this.highScoreDisplay = document.getElementById('high-score-display');
    this.extraLivesDisplay = document.getElementById('extra-lives');
    this.fruitDisplay = document.getElementById('fruit-display');
    this.mainMenu = document.getElementById('main-menu-container');
    this.gameStartButton = document.getElementById('game-start');
    this.gameReceiptCard = document.getElementById('game-receipt-card');
    this.receiptPlayerName = document.getElementById('receipt-player-name');
    this.receiptScore = document.getElementById('receipt-score');
    this.receiptBestScore = document.getElementById('receipt-best-score');
    this.receiptDate = document.getElementById('receipt-date');
    this.homeOptionsButton = document.getElementById('home-options-button');
    this.homeOptionsCloseButton = document.getElementById('home-options-close');
    this.homeOptionsPanel = document.getElementById('home-options-panel');
    this.menuActions = document.querySelector('.menu-actions');
    this.resumeGameButton = document.getElementById('resume-game');
    this.restartGameButton = document.getElementById('restart-game');
    this.returnHomeButton = document.getElementById('return-home');
    this.playerNameInput = document.getElementById('player-name-input');
    this.pauseButton = document.getElementById('pause-button');
    this.posControls = document.querySelector('.pos-controls');
    this.volumeSliders = [
      document.getElementById('home-volume-slider'),
      document.getElementById('pause-volume-slider'),
    ].filter((element) => element);
    this.volumeLabels = [
      document.getElementById('home-volume-label'),
      document.getElementById('pause-volume-label'),
    ].filter((element) => element);
    this.leftCover = document.getElementById('left-cover');
    this.rightCover = document.getElementById('right-cover');
    this.pausedText = document.getElementById('paused-text');
    this.bottomRow = document.getElementById('bottom-row');

    this.mazeArray = [
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOXXXXoXXXXXoXXoXXXXXoXXXXOX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['      o   X      X   o      '],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOooXXooooooo  oooooooXXooOX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
    ];

    this.maxFps = 120;
    this.tileSize = 8;
    this.scale = this.determineScale(1);
    this.scaledTileSize = this.tileSize * this.scale;
    this.firstGame = true;

    this.movementKeys = {
      // WASD
      87: 'up',
      83: 'down',
      65: 'left',
      68: 'right',

      // Arrow Keys
      38: 'up',
      40: 'down',
      37: 'left',
      39: 'right',
    };

    // Mobile touch trackers
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    this.fruitPoints = {
      1: 100,
      2: 300,
      3: 500,
      4: 700,
      5: 1000,
      6: 2000,
      7: 3000,
      8: 5000,
    };

    this.popMessageMilestones = [
      { points: 1000, message: 'Tap streak!', variant: 'streak' },
      { points: 2500, message: 'Cashback ioSi!', variant: 'cashback' },
      { points: 5000, message: 'Authorization approved', variant: 'approved' },
      { points: 10000, message: 'ioSi level up', variant: 'level-up' },
    ];
    this.playerNamePlaceholders = [
      'Es. Cashback Ninja',
      'Es. Tap Champion',
      'Es. POS Wizard',
      'Es. Bonus Hunter',
      'Es. Token Runner',
      'Es. Swipe Master',
      'Es. Card Combo',
      'Es. Pixel Payer',
    ];
    this.currentPlayerName = this.sanitizePlayerName(
      localStorage.getItem('pacmanNexiCurrentPlayer') || 'Player Nexi',
    );
    if (this.playerNameInput) {
      this.playerNameInput.placeholder = this.playerNamePlaceholders[
        Math.floor(Math.random() * this.playerNamePlaceholders.length)
      ];
    }
    this.setPauseButtonIcon('pause');

    this.otpBonusPoints = 500;
    this.otpPenaltyPoints = 250;
    this.otpCodeDuration = 1800;
    this.otpInputDuration = 5000;

    this.mazeArray.forEach((row, rowIndex) => {
      this.mazeArray[rowIndex] = row[0].split('');
    });

    this.gameStartButton.addEventListener(
      'click',
      this.startButtonClick.bind(this),
    );
    if (this.homeOptionsButton) {
      this.homeOptionsButton.addEventListener('click', this.showOptions.bind(this));
    }
    if (this.homeOptionsCloseButton) {
      this.homeOptionsCloseButton.addEventListener('click', this.hideOptions.bind(this));
    }
    if (this.homeOptionsPanel) {
      this.homeOptionsPanel.addEventListener('click', this.homeOptionsPanelClick.bind(this));
    }
    this.resumeGameButton.addEventListener(
      'click',
      this.resumeGameClick.bind(this),
    );
    this.restartGameButton.addEventListener(
      'click',
      this.restartGameClick.bind(this),
    );
    if (this.returnHomeButton) {
      this.returnHomeButton.addEventListener(
        'click',
        this.returnHomeClick.bind(this),
      );
    }
    if (this.pauseButton) {
      this.pauseButton.addEventListener('click', this.handlePauseKey.bind(this));
    }
    this.volumeSliders.forEach((slider) => {
      slider.addEventListener('input', this.volumeSliderInput.bind(this));
    });

    this.preloadAssets();
    // Payment success overlay
    this.paymentOverlay = document.createElement('div');
    this.paymentOverlay.className = 'payment-overlay';
    this.paymentOverlay.innerHTML = '<div class="payment-content">'
      + '<div class="payment-icon">✓</div>'
      + '<div class="payment-text">Pagamento effettuato</div>'
      + '</div>';
    this.paymentOverlay.style.display = 'none';
    this.mazeDiv.appendChild(this.paymentOverlay);
  }

  showPaymentSuccess() {
    this.paymentOverlay.style.display = 'flex';
    // hide after 2 seconds
    setTimeout(() => {
      this.hidePaymentSuccess();
    }, 2000);
  }

  hidePaymentSuccess() {
    this.paymentOverlay.style.display = 'none';
  }

  /**
   * Recursive method which determines the largest possible scale the game's graphics can use
   * @param {Number} scale
   */
  determineScale(scale) {
    const availableScreenHeight = Math.min(
      document.documentElement.clientHeight,
      window.innerHeight || 0,
    );
    const availableScreenWidth = Math.min(
      document.documentElement.clientWidth,
      window.innerWidth || 0,
    );
    const scaledTileSize = this.tileSize * scale;

    // The original Pac-Man game leaves 5 tiles of height (3 above, 2 below) surrounding the
    // maze for the UI. See app\style\graphics\spriteSheets\references\mazeGridSystemReference.png
    // for reference.
    const mazeTileHeight = this.mazeArray.length + 5;
    const mazeTileWidth = this.mazeArray[0][0].split('').length;

    if (
      scaledTileSize * mazeTileHeight < availableScreenHeight
      && scaledTileSize * mazeTileWidth < availableScreenWidth
    ) {
      return this.determineScale(scale + 1);
    }

    return scale - 1;
  }

  /**
   * Reveals the game underneath the loading covers and starts gameplay
   */
  startButtonClick() {
    this.currentPlayerName = this.sanitizePlayerName(
      this.playerNameInput && this.playerNameInput.value,
    );
    localStorage.setItem('pacmanNexiCurrentPlayer', this.currentPlayerName);
    this.hideGameReceipt();

    this.leftCover.style.left = '-50%';
    this.rightCover.style.right = '-50%';
    this.mainMenu.style.opacity = 0;
    if (this.posControls) {
      this.posControls.hidden = false;
    }
    this.gameStartButton.disabled = true;

    setTimeout(() => {
      this.mainMenu.style.visibility = 'hidden';
    }, 1000);

    this.reset();
    if (this.firstGame) {
      this.firstGame = false;
      this.init();
    } else if (this.gameEngine) {
      this.gameEngine.entityList = this.entityList;
      if (!this.gameEngine.started) {
        this.gameEngine.start();
      }
    }
    this.startGameplay(true);
  }

  /**
   * Resumes the current game from the pause menu
   */
  resumeGameClick() {
    if (!this.gameEngine || this.gameEngine.started) {
      return;
    }

    this.gameEngine.start();
    this.resumePausedGame();
  }

  /**
   * Starts a fresh game from the pause menu
   */
  restartGameClick() {
    if (!this.gameEngine) {
      return;
    }

    if (typeof this.gameEngine.stop === 'function') {
      this.gameEngine.stop();
    }

    this.soundManager.stopAmbience();
    this.hidePauseMenu();
    this.hideGameReceipt();

    this.reset();
    this.gameEngine.entityList = this.entityList;
    this.gameEngine.start();
    this.startGameplay(true);
  }

  /**
   * Abandons the current game and returns to the main menu
   */
  returnHomeClick() {
    if (!this.gameEngine) {
      return;
    }

    if (typeof this.gameEngine.stop === 'function') {
      this.gameEngine.stop();
    }

    this.soundManager.stopAmbience();
    this.hidePauseMenu();
    this.hideGameReceipt();
    this.reset();
    this.gameEngine.entityList = this.entityList;
    this.leftCover.style.left = '0';
    this.rightCover.style.right = '0';
    this.mainMenu.style.opacity = 1;
    this.mainMenu.style.visibility = 'visible';
    this.gameStartButton.disabled = false;
  }

  /**
   * Formats a compact timestamp for the transaction receipt
   * @param {Date} date - Receipt date
   * @returns {String}
   */
  formatReceiptDate(date = new Date()) {
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Shows the latest game recap as an 8-bit receipt during Game Over
   */
  showGameReceipt() {
    if (!this.gameReceiptCard) {
      return;
    }

    const score = Number(this.points || 0);
    const bestScore = Math.max(Number(this.highScore || 0), score);

    if (this.receiptPlayerName) {
      this.receiptPlayerName.textContent = this.sanitizePlayerName(this.currentPlayerName);
    }
    if (this.receiptScore) {
      this.receiptScore.textContent = String(score);
    }
    if (this.receiptBestScore) {
      this.receiptBestScore.textContent = String(bestScore);
    }
    if (this.receiptDate) {
      this.receiptDate.textContent = this.formatReceiptDate();
    }

    this.gameReceiptCard.hidden = false;
  }

  /**
   * Hides the latest game recap receipt
   */
  hideGameReceipt() {
    if (this.gameReceiptCard) {
      this.gameReceiptCard.hidden = true;
    }
  }

  /**
   * Hides the pause menu chrome
   */
  hidePauseMenu() {
    this.gameUi.style.filter = 'unset';
    this.pausedText.style.visibility = 'hidden';
    this.setPauseButtonIcon('pause');
  }

  /**
   * Restores gameplay UI, ambience, and timers after a pause
   */
  resumePausedGame() {
    this.soundManager.resumeAmbience();
    this.hidePauseMenu();
    this.activeTimers.forEach((timer) => {
      timer.resume();
    });
  }

  /**
   * Shows the homepage options controls
   */
  showOptions() {
    if (!this.homeOptionsPanel) {
      return;
    }

    if (this.mainMenu.style.visibility === 'hidden') {
      return;
    }

    this.homeOptionsPanel.style.display = 'flex';
  }

  /**
   * Closes homepage options when the modal backdrop is clicked
   * @param {Event} e - The click event from the options backdrop
   */
  homeOptionsPanelClick(e) {
    if (e.target === e.currentTarget) {
      this.hideOptions();
    }
  }

  /**
   * Hides the homepage options panel
   */
  hideOptions() {
    if (this.homeOptionsPanel) {
      this.homeOptionsPanel.style.display = 'none';
    }
  }

  /**
   * Updates volume from a slider input event
   * @param {Event} e - The slider input event
   */
  volumeSliderInput(e) {
    this.setVolumePreference(Number(e.target.value) / 100);
  }

  /**
   * Applies the persisted volume preference to sound and UI
   */
  applyStoredVolumePreference() {
    const storedPreference = parseFloat(
      localStorage.getItem('volumePreference') || 1,
    );
    this.setVolumePreference(storedPreference, false);
  }

  /**
   * Sets and persists the current volume preference
   * @param {Number} volume - Volume from 0 to 1
   * @param {Boolean} persist - Whether to save the value
   */
  setVolumePreference(volume, persist = true) {
    const normalizedVolume = Math.min(Math.max(volume || 0, 0), 1);
    const volumePercent = Math.round(normalizedVolume * 100);

    this.soundManager.setMasterVolume(normalizedVolume);
    if (persist) {
      localStorage.setItem('volumePreference', normalizedVolume);
    }
    this.syncVolumeControls(volumePercent);
  }

  /**
   * Syncs all visible volume controls
   * @param {Number} volumePercent - Volume from 0 to 100
   */
  syncVolumeControls(volumePercent) {
    this.volumeSliders.forEach((slider, index) => {
      this.volumeSliders[index].value = `${volumePercent}`;
    });
    this.volumeLabels.forEach((label, index) => {
      this.volumeLabels[index].textContent = `Volume ${volumePercent}%`;
    });
  }

  /**
   * Sets the icon for the pause button
   */
  setPauseButtonIcon(icon) {
    if (this.pauseButton) {
      const iconName = icon === 'play_arrow' ? 'play' : 'pause';
      const label = iconName === 'play' ? 'Resume game' : 'Pause game';
      this.pauseButton.setAttribute('data-icon', iconName);
      this.pauseButton.setAttribute('aria-label', label);
      this.pauseButton.innerHTML = '<span class="pause-icon-pixel" aria-hidden="true"></span>';
    }
  }

  /**
   * Displays an error message in the event assets are unable to download
   */
  displayErrorMessage() {
    const loadingContainer = document.getElementById('loading-container');
    const errorMessage = document.getElementById('error-message');
    loadingContainer.style.opacity = 0;
    setTimeout(() => {
      loadingContainer.remove();
      errorMessage.style.opacity = 1;
      errorMessage.style.visibility = 'visible';
    }, 1500);
  }

  /**
   * Load all assets into a hidden Div to pre-load them into memory.
   * There is probably a better way to read all of these file names.
   */
  preloadAssets() {
    return new Promise((resolve) => {
      const loadingContainer = document.getElementById('loading-container');
      const loadingPacman = document.getElementById('loading-pacman');
      const loadingDotMask = document.getElementById('loading-dot-mask');

      const imgBase = 'app/style/graphics/spriteSheets/';
      const imgSources = [
        // Pacman
        `${imgBase}characters/pacman/arrow_down.svg`,
        `${imgBase}characters/pacman/arrow_left.svg`,
        `${imgBase}characters/pacman/arrow_right.svg`,
        `${imgBase}characters/pacman/arrow_up.svg`,
        `${imgBase}characters/pacman/mini_pos_declined.svg`,
        `${imgBase}characters/pacman/mini_pos_down.svg`,
        `${imgBase}characters/pacman/mini_pos_left.svg`,
        `${imgBase}characters/pacman/mini_pos_right.svg`,
        `${imgBase}characters/pacman/mini_pos_up.svg`,

        // Cash enemies
        `${imgBase}characters/ghosts/cash/cash_card.svg`,
        `${imgBase}characters/ghosts/cash/cash_down.svg`,
        `${imgBase}characters/ghosts/cash/cash_left.svg`,
        `${imgBase}characters/ghosts/cash/cash_red.svg`,
        `${imgBase}characters/ghosts/cash/cash_right.svg`,
        `${imgBase}characters/ghosts/cash/cash_up.svg`,

        // Blinky
        `${imgBase}characters/ghosts/blinky/blinky_down_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up.svg`,

        // Clyde
        `${imgBase}characters/ghosts/clyde/clyde_down.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_left.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_right.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_up.svg`,

        // Inky
        `${imgBase}characters/ghosts/inky/inky_down.svg`,
        `${imgBase}characters/ghosts/inky/inky_left.svg`,
        `${imgBase}characters/ghosts/inky/inky_right.svg`,
        `${imgBase}characters/ghosts/inky/inky_up.svg`,

        // Pinky
        `${imgBase}characters/ghosts/pinky/pinky_down.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_left.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_right.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_up.svg`,

        // Ghosts Common
        `${imgBase}characters/ghosts/eyes_down.svg`,
        `${imgBase}characters/ghosts/eyes_left.svg`,
        `${imgBase}characters/ghosts/eyes_right.svg`,
        `${imgBase}characters/ghosts/eyes_up.svg`,
        `${imgBase}characters/ghosts/scared_blue.svg`,
        `${imgBase}characters/ghosts/scared_white.svg`,

        // Dots
        `${imgBase}pickups/pacdot.svg`,
        `${imgBase}pickups/powerPellet.svg`,
        `${imgBase}pickups/contactless.svg`,
        `${imgBase}pickups/otp.svg`,
        'app/style/graphics/nexi/card_contactless.svg',
        'app/style/graphics/nexi/card_coral.svg',
        'app/style/graphics/nexi/card_virtual.svg',
        'app/style/graphics/nexi/card_business.svg',
        'app/style/graphics/nexi/power_card_blue.svg',
        'app/style/graphics/nexi/power_card_gold.svg',
        'app/style/graphics/nexi/power_card_gray.svg',
        'app/style/graphics/nexi/power_card_black.svg',
        'app/style/graphics/nexi/token_secure.svg',
        'app/style/graphics/nexi/token_premium.svg',
        'app/style/graphics/nexi/token_black.svg',
        'app/style/graphics/nexi/token_vault.svg',

        // Fruit
        `${imgBase}pickups/apple.svg`,
        `${imgBase}pickups/bell.svg`,
        `${imgBase}pickups/cherry.svg`,
        `${imgBase}pickups/galaxian.svg`,
        `${imgBase}pickups/key.svg`,
        `${imgBase}pickups/melon.svg`,
        `${imgBase}pickups/orange.svg`,
        `${imgBase}pickups/strawberry.svg`,

        // Text
        `${imgBase}text/ready.svg`,

        // Points
        `${imgBase}text/100.svg`,
        `${imgBase}text/200.svg`,
        `${imgBase}text/300.svg`,
        `${imgBase}text/400.svg`,
        `${imgBase}text/500.svg`,
        `${imgBase}text/700.svg`,
        `${imgBase}text/800.svg`,
        `${imgBase}text/1000.svg`,
        `${imgBase}text/1600.svg`,
        `${imgBase}text/2000.svg`,
        `${imgBase}text/3000.svg`,
        `${imgBase}text/5000.svg`,

        // Maze
        `${imgBase}maze/maze_blue.svg`,

        // Misc
        'app/style/graphics/nexi/mini_pos_life.svg',
      ];

      const audioBase = 'app/style/audio/';
      const audioSources = [
        `${audioBase}game_start.mp3`,
        `${audioBase}pause.mp3`,
        `${audioBase}pause_beat.mp3`,
        `${audioBase}siren_1.mp3`,
        `${audioBase}siren_2.mp3`,
        `${audioBase}siren_3.mp3`,
        `${audioBase}power_up.mp3`,
        `${audioBase}extra_life.mp3`,
        `${audioBase}eyes.mp3`,
        `${audioBase}eat_ghost.mp3`,
        `${audioBase}death.mp3`,
        `${audioBase}fruit.mp3`,
        `${audioBase}dot_1.mp3`,
        `${audioBase}dot_2.mp3`,
      ];

      const totalSources = imgSources.length + audioSources.length;
      this.remainingSources = totalSources;

      loadingPacman.style.left = '0';
      loadingDotMask.style.width = '0';

      Promise.all([
        this.createElements(imgSources, 'img', totalSources, this),
        this.createElements(audioSources, 'audio', totalSources, this),
      ])
        .then(() => {
          loadingContainer.style.opacity = 0;
          resolve();

          setTimeout(() => {
            loadingContainer.remove();
            this.mainMenu.style.opacity = 1;
            this.mainMenu.style.visibility = 'visible';
          }, 1500);
        })
        .catch(this.displayErrorMessage);
    });
  }

  /**
   * Iterates through a list of sources and updates the loading bar as the assets load in
   * @param {String[]} sources
   * @param {('img'|'audio')} type
   * @param {Number} totalSources
   * @param {Object} gameCoord
   * @returns {Promise}
   */
  createElements(sources, type, totalSources, gameCoord) {
    const loadingContainer = document.getElementById('loading-container');
    const preloadDiv = document.getElementById('preload-div');
    const loadingPacman = document.getElementById('loading-pacman');
    const containerWidth = loadingContainer.scrollWidth
      - loadingPacman.scrollWidth;
    const loadingDotMask = document.getElementById('loading-dot-mask');

    const gameCoordRef = gameCoord;

    return new Promise((resolve, reject) => {
      let loadedSources = 0;

      sources.forEach((source) => {
        const element = type === 'img' ? new Image() : new Audio();
        preloadDiv.appendChild(element);

        const elementReady = () => {
          gameCoordRef.remainingSources -= 1;
          loadedSources += 1;
          const percent = 1 - gameCoordRef.remainingSources / totalSources;
          loadingPacman.style.left = `${percent * containerWidth}px`;
          loadingDotMask.style.width = loadingPacman.style.left;

          if (loadedSources === sources.length) {
            resolve();
          }
        };

        if (type === 'img') {
          element.onload = elementReady;
          element.onerror = reject;
        } else {
          element.addEventListener('canplaythrough', elementReady);
          element.onerror = reject;
        }

        element.src = source;

        if (type === 'audio') {
          element.load();
        }
      });
    });
  }

  /**
   * Resets gameCoordinator values to their default states
   */
  reset() {
    if (this.pacman) {
      this.deactivateContactlessMode();
    }

    this.removeTimer({ detail: { timer: this.contactlessSpawnTimer } });
    this.contactlessSpawnTimer = undefined;

    if (this.contactlessPickup) {
      this.hideContactlessPickup();
    }

    this.removeTimer({ detail: { timer: this.otpSpawnTimer } });
    this.otpSpawnTimer = undefined;

    if (this.otpPickup) {
      this.hideOtpPickup();
    }

    this.clearOtpChallenge(false);
    this.clearPopMessage();
    this.clearDisplayText();
    this.hideGameReceipt();

    this.activeTimers = [];
    this.points = 0;
    this.shownPopMessageMilestones = [];
    this.level = 1;
    this.lives = 2;
    this.extraLifeGiven = false;
    this.remainingDots = 0;
    this.allowKeyPresses = true;
    this.allowPacmanMovement = false;
    this.allowPause = false;
    this.cutscene = true;
    this.highScore = localStorage.getItem('highScore');

    if (this.firstGame) {
      setInterval(() => {
        this.collisionDetectionLoop();
      }, 500);

      this.pacman = new Pacman(
        this.scaledTileSize,
        this.mazeArray,
        new CharacterUtil(this.scaledTileSize),
      );
      this.blinky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'blinky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.pinky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'pinky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.inky = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'inky',
        this.level,
        new CharacterUtil(this.scaledTileSize),
        this.blinky,
      );
      this.clyde = new Ghost(
        this.scaledTileSize,
        this.mazeArray,
        this.pacman,
        'clyde',
        this.level,
        new CharacterUtil(this.scaledTileSize),
      );
      this.fruit = new Pickup(
        'fruit',
        this.scaledTileSize,
        13.5,
        17,
        this.pacman,
        this.mazeDiv,
        100,
      );
      this.contactlessPickup = new Pickup(
        'contactless',
        this.scaledTileSize,
        13.5,
        17,
        this.pacman,
        this.mazeDiv,
        0,
      );
      this.otpPickup = new Pickup(
        'otp',
        this.scaledTileSize,
        13.5,
        17,
        this.pacman,
        this.mazeDiv,
        0,
      );
    }

    this.entityList = [
      this.pacman,
      this.blinky,
      this.pinky,
      this.inky,
      this.clyde,
      this.fruit,
      this.contactlessPickup,
      this.otpPickup,
    ];

    this.ghosts = [this.blinky, this.pinky, this.inky, this.clyde];

    this.scaredGhosts = [];
    this.eyeGhosts = 0;

    if (this.firstGame) {
      this.drawMaze(this.mazeArray, this.entityList);
      this.soundManager = new SoundManager();
      this.setUiDimensions();
    } else {
      this.pacman.reset();
      this.ghosts.forEach((ghost) => {
        ghost.reset(true);
      });
      this.pickups.forEach((pickup) => {
        if (!['contactless', 'fruit', 'otp'].includes(pickup.type)) {
          this.remainingDots += 1;
          pickup.reset();
          this.entityList.push(pickup);
        }
      });
    }

    this.pointsDisplay.innerHTML = '00';
    this.highScoreDisplay.innerHTML = this.highScore || '00';
    this.clearDisplay(this.fruitDisplay);

    this.applyStoredVolumePreference();
  }

  /**
   * Calls necessary setup functions to start the game
   */
  init() {
    this.registerEventListeners();
    this.registerTouchListeners();

    this.gameEngine = new GameEngine(this.maxFps, this.entityList);
    this.gameEngine.start();
  }

  /**
   * Adds HTML elements to draw on the webpage by iterating through the 2D maze array
   * @param {Array} mazeArray - 2D array representing the game board
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  drawMaze(mazeArray, entityList) {
    this.pickups = [this.fruit, this.contactlessPickup, this.otpPickup];

    this.gameBaseWidth = this.scaledTileSize * 28;
    this.mazeDiv.style.height = `${this.scaledTileSize * 31}px`;
    this.mazeDiv.style.width = `${this.gameBaseWidth}px`;
    this.gameUi.style.minWidth = `${this.gameBaseWidth}px`;
    this.gameUi.style.width = `${this.gameBaseWidth}px`;
    this.bottomRow.style.minHeight = `${this.scaledTileSize * 2}px`;
    this.dotContainer = document.getElementById('dot-container');

    mazeArray.forEach((row, rowIndex) => {
      row.forEach((block, columnIndex) => {
        if (block === 'o' || block === 'O') {
          const type = block === 'o' ? 'pacdot' : 'powerPellet';
          const points = block === 'o' ? 10 : 50;
          const dot = new Pickup(
            type,
            this.scaledTileSize,
            columnIndex,
            rowIndex,
            this.pacman,
            this.dotContainer,
            points,
          );

          entityList.push(dot);
          this.pickups.push(dot);
          this.remainingDots += 1;
        }
      });
    });
  }

  setUiDimensions() {
    this.gameUi.style.fontSize = `${this.scaledTileSize}px`;
    this.rowTop.style.marginBottom = `${this.scaledTileSize}px`;
  }

  /**
   * Loop which periodically checks which pickups are nearby Pacman.
   * Pickups which are far away will not be considered for collision detection.
   */
  collisionDetectionLoop() {
    if (this.pacman.position) {
      const maxDistance = this.pacman.velocityPerMs * 750;
      const pacmanCenter = {
        x: this.pacman.position.left + this.scaledTileSize,
        y: this.pacman.position.top + this.scaledTileSize,
      };

      // Set this flag to TRUE to see how two-phase collision detection works!
      const debugging = false;

      this.pickups.forEach((pickup) => {
        pickup.checkPacmanProximity(maxDistance, pacmanCenter, debugging);
      });
    }
  }

  /**
   * Displays "Ready!" and allows Pacman to move after a brief delay
   * @param {Boolean} initialStart - Special condition for the game's beginning
   */
  startGameplay(initialStart) {
    if (initialStart) {
      this.soundManager.play('game_start');
    }

    this.scaredGhosts = [];
    this.eyeGhosts = 0;
    this.allowPacmanMovement = false;

    const left = this.scaledTileSize * 11;
    const top = this.scaledTileSize * 16.5;
    const duration = initialStart ? 4500 : 2000;
    const width = this.scaledTileSize * 6;
    const height = this.scaledTileSize * 2;

    this.displayText({ left, top }, 'ready', duration, width, height);
    this.updateExtraLivesDisplay();

    new Timer(() => {
      this.allowPause = true;
      this.cutscene = false;
      this.soundManager.setCutscene(this.cutscene);
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));

      this.allowPacmanMovement = true;
      this.pacman.moving = true;

      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.moving = true;
      });

      this.ghostCycle('scatter');

      this.idleGhosts = [this.pinky, this.inky, this.clyde];
      this.releaseGhost();
      this.startContactlessSpawnCycle();
      this.startOtpSpawnCycle();
    }, duration);
  }

  /**
   * Clears out all children nodes from a given display element
   * @param {String} display
   */
  clearDisplay(display) {
    while (display.firstChild) {
      display.removeChild(display.firstChild);
    }
  }

  /**
   * Displays extra life images equal to the number of remaining lives
   */
  updateExtraLivesDisplay() {
    this.clearDisplay(this.extraLivesDisplay);

    for (let i = 0; i < this.lives; i += 1) {
      const extraLifePic = document.createElement('img');
      extraLifePic.setAttribute('src', 'app/style/graphics/nexi/mini_pos_life.svg');
      extraLifePic.style.height = `${this.scaledTileSize * 2}px`;
      this.extraLivesDisplay.appendChild(extraLifePic);
    }
  }

  /**
   * Displays a rolling log of the seven most-recently eaten fruit
   * @param {String} rawImageSource
   */
  updateFruitDisplay(rawImageSource) {
    const parsedSource = rawImageSource.slice(
      rawImageSource.indexOf('(') + 1,
      rawImageSource.indexOf(')'),
    );

    if (this.fruitDisplay.children.length === 7) {
      this.fruitDisplay.removeChild(this.fruitDisplay.firstChild);
    }

    const fruitPic = document.createElement('img');
    fruitPic.setAttribute('src', parsedSource);
    fruitPic.style.height = `${this.scaledTileSize * 2}px`;
    this.fruitDisplay.appendChild(fruitPic);
  }

  /**
   * Cycles the ghosts between 'chase' and 'scatter' mode
   * @param {('chase'|'scatter')} mode
   */
  ghostCycle(mode) {
    const delay = mode === 'scatter' ? 7000 : 20000;
    const nextMode = mode === 'scatter' ? 'chase' : 'scatter';

    this.ghostCycleTimer = new Timer(() => {
      this.ghosts.forEach((ghost) => {
        ghost.changeMode(nextMode);
      });

      this.ghostCycle(nextMode);
    }, delay);
  }

  /**
   * Releases a ghost from the Ghost House after a delay
   */
  releaseGhost() {
    if (this.idleGhosts.length > 0) {
      const delay = Math.max((8 - (this.level - 1) * 4) * 1000, 0);

      this.endIdleTimer = new Timer(() => {
        this.idleGhosts[0].endIdleMode();
        this.idleGhosts.shift();
      }, delay);
    }
  }

  /**
   * Register listeners for various game sequences
   */
  registerEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('swipe', this.handleSwipe.bind(this));
    window.addEventListener('awardPoints', this.awardPoints.bind(this));
    window.addEventListener('deathSequence', this.deathSequence.bind(this));
    window.addEventListener('dotEaten', this.dotEaten.bind(this));
    window.addEventListener('powerUp', this.powerUp.bind(this));
    window.addEventListener('contactlessMode', this.contactlessMode.bind(this));
    window.addEventListener('otpMode', this.otpMode.bind(this));
    window.addEventListener('eatGhost', this.eatGhost.bind(this));
    window.addEventListener('restoreGhost', this.restoreGhost.bind(this));
    window.addEventListener('addTimer', this.addTimer.bind(this));
    window.addEventListener('removeTimer', this.removeTimer.bind(this));
    window.addEventListener('releaseGhost', this.releaseGhost.bind(this));
  }

  /**
   * Register listeners for touchstart and touchend to handle mobile device swipes
   */
  registerTouchListeners() {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  /**
   * Sets touch values where the user's touch begins
   * @param {Event} event
   */
  handleTouchStart(event) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  /**
   * Sets touch values where the user's touch ends and attempts to change Pac-Man's direction
   * @param {*} event
   */
  handleTouchEnd(event) {
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    const diffX = this.touchEndX - this.touchStartX;
    const diffY = this.touchEndY - this.touchStartY;
    let direction;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      direction = diffX > 0 ? 'right' : 'left';
    } else {
      direction = diffY > 0 ? 'down' : 'up';
    }

    window.dispatchEvent(new CustomEvent('swipe', {
      detail: {
        direction,
      },
    }));
  }

  /**
   * Calls Pacman's changeDirection event if certain conditions are met
   * @param {({'up'|'down'|'left'|'right'})} direction
   */
  changeDirection(direction) {
    if (this.allowKeyPresses && this.gameEngine.running) {
      this.pacman.changeDirection(direction, this.allowPacmanMovement);
    }
  }

  /**
   * Calls various class functions depending upon the pressed key
   * @param {Event} e - The keydown event to evaluate
   */
  handleKeyDown(e) {
    if (this.otpActive) {
      this.handleOtpKeyDown(e);
    } else if (e.keyCode === 27) {
      // ESC key
      this.handlePauseKey();
    } else if (e.keyCode === 81) {
      // Q
      this.showOptions();
    } else if (this.movementKeys[e.keyCode]) {
      this.changeDirection(this.movementKeys[e.keyCode]);
    }
  }

  /**
   * Calls changeDirection with the direction of the user's swipe
   * @param {Event} e - The direction of the swipe
   */
  handleSwipe(e) {
    const { direction } = e.detail;
    this.changeDirection(direction);
  }

  /**
   * Handle behavior for the pause key
   */
  handlePauseKey() {
    if (this.allowPause) {
      this.allowPause = false;

      setTimeout(() => {
        if (!this.cutscene) {
          this.allowPause = true;
        }
      }, 500);

      this.gameEngine.changePausedState(this.gameEngine.running);
      this.soundManager.play('pause');

      if (this.gameEngine.started) {
        this.resumePausedGame();
      } else {
        this.soundManager.stopAmbience();
        this.soundManager.setAmbience('pause_beat', true);
        this.gameUi.style.filter = 'blur(5px)';
        this.pausedText.style.visibility = 'visible';
        this.setPauseButtonIcon('play_arrow');
        this.activeTimers.forEach((timer) => {
          timer.pause();
        });
      }
    }
  }

  /**
   * Adds points to the player's total
   * @param {({ detail: { points: Number }})} e - Contains a quantity of points to add
   */
  awardPoints(e) {
    const previousPoints = this.points;
    this.points = Math.max(0, this.points + e.detail.points);
    this.pointsDisplay.innerText = this.points;
    this.displayPointMilestoneMessages(previousPoints, this.points);

    if (this.points > (this.highScore || 0)) {
      this.highScore = this.points;
      this.highScoreDisplay.innerText = this.points;
      localStorage.setItem('highScore', this.highScore);
    }

    if (this.points >= 10000 && !this.extraLifeGiven) {
      this.extraLifeGiven = true;
      this.soundManager.play('extra_life');
      this.lives += 1;
      this.updateExtraLivesDisplay();
    }

    if (e.detail.type === 'fruit') {
      const left = e.detail.points >= 1000
        ? this.scaledTileSize * 12.5
        : this.scaledTileSize * 13;
      const top = this.scaledTileSize * 16.5;
      const width = e.detail.points >= 1000
        ? this.scaledTileSize * 3
        : this.scaledTileSize * 2;
      const height = this.scaledTileSize * 2;

      this.displayText({ left, top }, e.detail.points, 2000, width, height);
      this.activatePaymentCardVisualState();
      this.soundManager.play('fruit');
      this.updateFruitDisplay(
        this.fruit.determineImage('fruit', e.detail.points),
      );
    }
  }

  /**
   * Shows payment card sprites on cash enemies after points are collected.
   */
  activatePaymentCardVisualState() {
    this.removeTimer({ detail: { timer: this.paymentCardVisualTimer } });

    this.ghosts.forEach((ghost) => {
      if (ghost.setPaymentCardVisualState) {
        ghost.setPaymentCardVisualState();
      }
    });

    this.paymentCardVisualTimer = new Timer(() => {
      this.ghosts.forEach((ghost) => {
        if (ghost.clearPaymentCardVisualState) {
          ghost.clearPaymentCardVisualState();
        }
      });
      this.paymentCardVisualTimer = undefined;
    }, 5000);
  }

  /**
   * Animates Pacman's death, subtracts a life, and resets character positions if
   * the player has remaining lives.
   */
  deathSequence() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.soundManager.stopAmbience();
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });
    this.removeTimer({ detail: { timer: this.contactlessSpawnTimer } });
    this.contactlessSpawnTimer = undefined;
    this.removeTimer({ detail: { timer: this.otpSpawnTimer } });
    this.otpSpawnTimer = undefined;
    this.hideContactlessPickup();
    this.hideOtpPickup();
    this.deactivateContactlessMode();
    this.clearOtpChallenge(false);
    this.clearPopMessage();

    this.allowKeyPresses = false;
    this.pacman.moving = false;
    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.moving = false;
    });

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });
      this.pacman.prepDeathAnimation();
      this.soundManager.play('death');

      if (this.lives > 0) {
        this.lives -= 1;

        new Timer(() => {
          this.mazeCover.style.visibility = 'visible';
          new Timer(() => {
            this.allowKeyPresses = true;
            this.mazeCover.style.visibility = 'hidden';
            this.pacman.reset();
            this.ghosts.forEach((ghost) => {
              ghost.reset();
            });
            this.fruit.hideFruit();
            this.contactlessPickup.hideContactless();
            this.otpPickup.hideOtp();

            this.startGameplay();
          }, 500);
        }, 2250);
      } else {
        this.gameOver();
      }
    }, 750);
  }

  /**
   * Displays GAME OVER text and displays the menu so players can play again
   */
  gameOver() {
    this.saveLeaderboardEntry();
    localStorage.setItem('highScore', this.highScore);

    new Timer(() => {
      this.displayText(
        {
          left: this.scaledTileSize * 9,
          top: this.scaledTileSize * 16.5,
        },
        'game_over',
        4000,
        this.scaledTileSize * 10,
        this.scaledTileSize * 2,
      );
      this.showGameReceipt();
      this.fruit.hideFruit();

      new Timer(() => {
        this.leftCover.style.left = '0';
        this.rightCover.style.right = '0';

        setTimeout(() => {
          this.hideGameReceipt();
          this.mainMenu.style.opacity = 1;
          this.gameStartButton.disabled = false;
          this.mainMenu.style.visibility = 'visible';
        }, 1000);
      }, 2500);
    }, 2250);
  }

  sanitizePlayerName(rawName) {
    const normalized = String(rawName || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return 'Player Nexi';
    }

    return normalized.slice(0, 20);
  }

  saveLeaderboardEntry() {
    const score = Number(this.points || 0);
    if (score <= 0) {
      return Promise.resolve(false);
    }

    const playerName = this.sanitizePlayerName(this.currentPlayerName);
    const nextEntry = {
      name: playerName,
      score,
      date: new Date().toISOString(),
    };

    return this.saveRemoteLeaderboardEntry(nextEntry).then((remoteSaved) => {
      if (remoteSaved) {
        return true;
      }

      this.saveLocalLeaderboardEntry(nextEntry);
      return false;
    });
  }

  saveLocalLeaderboardEntry(nextEntry) {
    let leaderboard = [];
    try {
      leaderboard = JSON.parse(
        localStorage.getItem('pacmanNexiLeaderboard') || '[]',
      );
      if (!Array.isArray(leaderboard)) {
        leaderboard = [];
      }
    } catch (err) {
      leaderboard = [];
    }

    leaderboard.push(nextEntry);
    leaderboard.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    localStorage.setItem(
      'pacmanNexiLeaderboard',
      JSON.stringify(leaderboard.slice(0, 20)),
    );
    return true;
  }

  saveRemoteLeaderboardEntry(entry) {
    if (typeof FirebaseLeaderboard === 'undefined') {
      return Promise.resolve(false);
    }

    return Promise.resolve()
      .then(() => FirebaseLeaderboard.saveGame(entry))
      .then(Boolean)
      .catch(() => false);
  }

  /**
   * Handle events related to the number of remaining dots
   */
  dotEaten() {
    this.remainingDots -= 1;

    this.soundManager.playDotSound();

    if (this.remainingDots === 174 || this.remainingDots === 74) {
      this.createFruit();
    }

    if (this.remainingDots === 40 || this.remainingDots === 20) {
      this.speedUpBlinky();
    }

    if (this.remainingDots === 0) {
      this.advanceLevel();
    }
  }

  /**
   * Creates a bonus fruit for ten seconds
   */
  createFruit() {
    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.fruit.showFruit(this.fruitPoints[this.level] || 5000);
    this.fruitTimer = new Timer(() => {
      this.fruit.hideFruit();
    }, 10000);
  }

  /**
   * Speeds up Blinky and raises the background noise pitch
   */
  speedUpBlinky() {
    this.blinky.speedUp();

    if (this.scaredGhosts.length === 0 && this.eyeGhosts === 0) {
      this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
    }
  }

  /**
   * Determines the correct siren ambience
   * @param {Number} remainingDots
   * @returns {String}
   */
  determineSiren(remainingDots) {
    let sirenNum;

    if (remainingDots > 40) {
      sirenNum = 1;
    } else if (remainingDots > 20) {
      sirenNum = 2;
    } else {
      sirenNum = 3;
    }

    return `siren_${sirenNum}`;
  }

  /**
   * Resets the gameboard and prepares the next level
   */
  advanceLevel() {
    this.allowPause = false;
    this.cutscene = true;
    this.soundManager.setCutscene(this.cutscene);
    this.allowKeyPresses = false;
    this.soundManager.stopAmbience();

    this.entityList.forEach((entity) => {
      const entityRef = entity;
      entityRef.moving = false;
    });

    this.removeTimer({ detail: { timer: this.fruitTimer } });
    this.removeTimer({ detail: { timer: this.ghostCycleTimer } });
    this.removeTimer({ detail: { timer: this.endIdleTimer } });
    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });
    this.removeTimer({ detail: { timer: this.contactlessSpawnTimer } });
    this.contactlessSpawnTimer = undefined;
    this.removeTimer({ detail: { timer: this.otpSpawnTimer } });
    this.otpSpawnTimer = undefined;
    this.hideContactlessPickup();
    this.hideOtpPickup();
    this.deactivateContactlessMode();
    this.clearOtpChallenge(false);
    this.clearPopMessage();

    const imgBase = 'app/style//graphics/spriteSheets/maze/';

    new Timer(() => {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });

      this.mazeImg.src = `${imgBase}maze_white.svg`;
      new Timer(() => {
        this.mazeImg.src = `${imgBase}maze_blue.svg`;
        new Timer(() => {
          this.mazeImg.src = `${imgBase}maze_white.svg`;
          new Timer(() => {
            this.mazeImg.src = `${imgBase}maze_blue.svg`;
            new Timer(() => {
              this.mazeImg.src = `${imgBase}maze_white.svg`;
              new Timer(() => {
                this.mazeImg.src = `${imgBase}maze_blue.svg`;
                new Timer(() => {
                  this.mazeCover.style.visibility = 'visible';
                  new Timer(() => {
                    this.mazeCover.style.visibility = 'hidden';
                    this.level += 1;
                    this.allowKeyPresses = true;
                    this.entityList.forEach((entity) => {
                      const entityRef = entity;
                      if (entityRef.level) {
                        entityRef.level = this.level;
                      }
                      entityRef.reset();
                      if (entityRef instanceof Ghost) {
                        entityRef.resetDefaultSpeed();
                      }
                      if (
                        entityRef instanceof Pickup
                        && !['contactless', 'fruit', 'otp'].includes(entityRef.type)
                      ) {
                        this.remainingDots += 1;
                      }
                    });
                    this.startGameplay();
                  }, 500);
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }, 250);
      }, 250);
    }, 2000);
  }

  /**
   * Flashes ghosts blue and white to indicate the end of the powerup
   * @param {Number} flashes - Total number of elapsed flashes
   * @param {Number} maxFlashes - Total flashes to show
   */
  flashGhosts(flashes, maxFlashes) {
    if (flashes === maxFlashes) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.endScared();
      });
      this.scaredGhosts = [];
      if (this.eyeGhosts === 0) {
        this.soundManager.setAmbience(this.determineSiren(this.remainingDots));
      }
    } else if (this.scaredGhosts.length > 0) {
      this.scaredGhosts.forEach((ghost) => {
        ghost.toggleScaredColor();
      });

      this.ghostFlashTimer = new Timer(() => {
        this.flashGhosts(flashes + 1, maxFlashes);
      }, 250);
    }
  }

  /**
   * Upon eating a power pellet, sets the ghosts to 'scared' mode
   */
  powerUp() {
    if (this.remainingDots !== 0) {
      this.soundManager.setAmbience('power_up');
    }

    this.removeTimer({ detail: { timer: this.ghostFlashTimer } });

    this.ghostCombo = 0;
    this.scaredGhosts = [];

    this.ghosts.forEach((ghost) => {
      if (ghost.mode !== 'eyes') {
        this.scaredGhosts.push(ghost);
      }
    });

    this.scaredGhosts.forEach((ghost) => {
      ghost.becomeScared();
    });
    this.showPaymentSuccess();

    const powerDuration = Math.max((7 - this.level) * 1000, 0);
    this.ghostFlashTimer = new Timer(() => {
      this.flashGhosts(0, 9);
    }, powerDuration);
  }

  /**
   * Starts the Contactless pickup spawn timer
   */
  startContactlessSpawnCycle() {
    this.removeTimer({ detail: { timer: this.contactlessSpawnTimer } });
    this.contactlessSpawnTimer = new Timer(() => {
      this.createContactlessPickup();
    }, 20000);
  }

  /**
   * Shows the temporary Contactless pickup and schedules its next spawn
   */
  createContactlessPickup() {
    const { column, row } = this.determineContactlessSpawnPosition();

    this.hideContactlessPickup();
    this.contactlessPickup.showContactless(column, row, this.scaledTileSize);
    this.contactlessHideTimer = new Timer(() => {
      this.hideContactlessPickup();
    }, 10000);
    this.startContactlessSpawnCycle();
  }

  /**
   * Hides the temporary Contactless pickup
   */
  hideContactlessPickup() {
    this.removeTimer({ detail: { timer: this.contactlessHideTimer } });
    this.contactlessHideTimer = undefined;
    this.contactlessPickup.hideContactless();
  }

  /**
   * Chooses a valid dot tile for the Contactless pickup spawn
   * @returns {({ column: number, row: number })}
   */
  determineContactlessSpawnPosition() {
    return this.determinePickupSpawnPosition(
      'No contactless spawn positions available.',
    );
  }

  /**
   * Starts the OTP pickup spawn timer
   */
  startOtpSpawnCycle() {
    this.removeTimer({ detail: { timer: this.otpSpawnTimer } });
    this.otpSpawnTimer = new Timer(() => {
      this.createOtpPickup();
    }, 20000);
  }

  /**
   * Shows the temporary OTP pickup and schedules its next spawn
   */
  createOtpPickup() {
    const { column, row } = this.determineOtpSpawnPosition();

    this.hideOtpPickup();
    this.otpPickup.showOtp(column, row, this.scaledTileSize);
    this.otpHideTimer = new Timer(() => {
      this.hideOtpPickup();
    }, 10000);
    this.startOtpSpawnCycle();
  }

  /**
   * Hides the temporary OTP pickup
   */
  hideOtpPickup() {
    this.removeTimer({ detail: { timer: this.otpHideTimer } });
    this.otpHideTimer = undefined;
    this.otpPickup.hideOtp();
  }

  /**
   * Chooses a valid dot tile for the OTP pickup spawn
   * @returns {({ column: number, row: number })}
   */
  determineOtpSpawnPosition() {
    return this.determinePickupSpawnPosition(
      'No OTP spawn positions available.',
    );
  }

  /**
   * Chooses a random valid dot tile for a temporary pickup spawn
   * @param {String} errorMessage
   * @returns {({ column: number, row: number })}
   */
  determinePickupSpawnPosition(errorMessage) {
    const positions = [];

    this.mazeArray.forEach((row, rowIndex) => {
      row.forEach((block, columnIndex) => {
        if (block === 'o') {
          positions.push({
            column: columnIndex,
            row: rowIndex,
          });
        }
      });
    });

    if (positions.length === 0) {
      throw new Error(errorMessage);
    }

    return positions[Math.floor(Math.random() * positions.length)];
  }

  /**
   * Starts the OTP challenge after the temporary pickup is collected
   */
  otpMode() {
    this.hideOtpPickup();
    this.startOtpChallenge();
  }

  /**
   * Generates a four-digit OTP code
   * @returns {String}
   */
  generateOtpCode() {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  }

  /**
   * Starts the OTP memorization and input sequence
   */
  startOtpChallenge() {
    this.clearOtpChallenge(false);
    this.pauseGameplayForOtpChallenge();

    this.otpCode = this.generateOtpCode();
    this.otpInput = '';
    this.otpActive = true;
    this.otpAcceptingInput = false;
    this.displayOtpCode();

    this.otpRevealTimer = new Timer(() => {
      this.otpAcceptingInput = true;
      this.displayOtpInput();
      this.otpTimeoutTimer = new Timer(() => {
        this.completeOtpChallenge('expired');
      }, this.otpInputDuration);
    }, this.otpCodeDuration);
  }

  /**
   * Freezes gameplay while the OTP challenge is active
   */
  pauseGameplayForOtpChallenge() {
    this.otpPausedState = {
      allowKeyPresses: this.allowKeyPresses,
      allowPacmanMovement: this.allowPacmanMovement,
      allowPause: this.allowPause,
      movingEntities: this.entityList
        .filter((entity) => typeof entity.moving !== 'undefined')
        .map((entity) => ({
          entity,
          moving: entity.moving,
        })),
      timers: [...this.activeTimers],
    };

    this.allowKeyPresses = false;
    this.allowPacmanMovement = false;
    this.allowPause = false;
    this.otpPausedState.movingEntities.forEach(({ entity }) => {
      const entityRef = entity;
      entityRef.moving = false;
    });
    this.otpPausedState.timers.forEach((timer) => {
      timer.pause(true);
    });
  }

  /**
   * Restores gameplay after the OTP challenge closes
   */
  resumeGameplayAfterOtpChallenge() {
    if (!this.otpPausedState) {
      return;
    }

    this.allowKeyPresses = this.otpPausedState.allowKeyPresses;
    this.allowPacmanMovement = this.otpPausedState.allowPacmanMovement;
    this.allowPause = this.otpPausedState.allowPause;
    this.otpPausedState.movingEntities.forEach(({ entity, moving }) => {
      const entityRef = entity;
      entityRef.moving = moving;
    });
    this.otpPausedState.timers.forEach((timer) => {
      timer.resume(true);
    });
    this.otpPausedState = undefined;
  }

  /**
   * Clears OTP challenge timers and overlay
   * @param {Boolean} resumeGameplay
   */
  clearOtpChallenge(resumeGameplay) {
    this.removeTimer({ detail: { timer: this.otpRevealTimer } });
    this.removeTimer({ detail: { timer: this.otpTimeoutTimer } });
    this.otpRevealTimer = undefined;
    this.otpTimeoutTimer = undefined;
    this.clearOtpOverlay();

    if (resumeGameplay) {
      this.resumeGameplayAfterOtpChallenge();
    } else {
      this.otpPausedState = undefined;
    }

    this.otpActive = false;
    this.otpAcceptingInput = false;
    this.otpCode = '';
    this.otpInput = '';
    this.otpInputBoxes = [];
  }

  /**
   * Removes the active OTP overlay
   */
  clearOtpOverlay() {
    if (this.otpOverlay) {
      this.mazeDiv.removeChild(this.otpOverlay);
      this.otpOverlay = undefined;
    }
  }

  /**
   * Displays the OTP code before input starts
   */
  displayOtpCode() {
    const otpOverlay = document.createElement('div');
    const label = document.createElement('div');
    const digits = document.createElement('div');

    this.clearOtpOverlay();
    otpOverlay.classList.add('otp-overlay', 'otp-code-reveal');
    label.classList.add('otp-label');
    label.innerText = 'OTP';
    digits.classList.add('otp-digit-row');

    this.otpCode.split('').forEach((digit) => {
      const digitBox = document.createElement('div');
      digitBox.classList.add('otp-digit-box', 'otp-digit-reveal');
      digitBox.innerText = digit;
      digits.appendChild(digitBox);
    });

    otpOverlay.appendChild(label);
    otpOverlay.appendChild(digits);
    this.mazeDiv.appendChild(otpOverlay);
    this.otpOverlay = otpOverlay;
  }

  /**
   * Displays the OTP input boxes
   */
  displayOtpInput() {
    const otpOverlay = document.createElement('div');
    const label = document.createElement('div');
    const boxes = document.createElement('div');

    this.clearOtpOverlay();
    otpOverlay.classList.add('otp-overlay', 'otp-input-panel');
    label.classList.add('otp-label');
    label.innerText = 'INSERT OTP';
    boxes.classList.add('otp-digit-row');
    this.otpInputBoxes = [];

    for (let i = 0; i < 4; i += 1) {
      const inputBox = document.createElement('div');
      inputBox.classList.add('otp-digit-box', 'otp-input-box');
      boxes.appendChild(inputBox);
      this.otpInputBoxes.push(inputBox);
    }

    otpOverlay.appendChild(label);
    otpOverlay.appendChild(boxes);
    this.mazeDiv.appendChild(otpOverlay);
    this.otpOverlay = otpOverlay;
    this.updateOtpInputDisplay();
  }

  /**
   * Updates the visible OTP input boxes from the current input
   */
  updateOtpInputDisplay() {
    this.otpInputBoxes.forEach((inputBox, index) => {
      const inputBoxRef = inputBox;
      inputBoxRef.innerText = this.otpInput[index] || '';
    });
  }

  /**
   * Handles keyboard input while the OTP challenge is active
   * @param {Event} e
   */
  handleOtpKeyDown(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    if (!this.otpAcceptingInput) {
      return;
    }

    const { keyCode } = e;
    const rawKey = e.key || String.fromCharCode(keyCode);
    const digitKeyCode = keyCode >= 48 && keyCode <= 57;
    const digitNumpadCode = keyCode >= 96 && keyCode <= 105;
    const digit = /^[0-9]$/.test(rawKey)
      ? rawKey
      : String(keyCode - (digitNumpadCode ? 96 : 48));

    if (keyCode === 8 || rawKey === 'Backspace') {
      this.otpInput = this.otpInput.slice(0, -1);
      this.updateOtpInputDisplay();
    } else if (
      this.otpInput.length < 4
      && (digitKeyCode || digitNumpadCode || /^[0-9]$/.test(rawKey))
    ) {
      this.otpInput += digit;
      this.updateOtpInputDisplay();
    }

    if (this.otpInput.length === 4) {
      this.verifyOtpInput();
    }
  }

  /**
   * Verifies the entered OTP code
   */
  verifyOtpInput() {
    const result = this.otpInput === this.otpCode ? 'approved' : 'failed';
    this.completeOtpChallenge(result);
  }

  /**
   * Finishes the OTP challenge and reports the result
   * @param {('approved'|'failed'|'expired')} result
   */
  completeOtpChallenge(result) {
    const messages = {
      approved: 'OTP approved',
      failed: 'OTP failed',
      expired: 'OTP expired',
    };

    this.clearOtpChallenge(true);

    const points = result === 'approved'
      ? this.otpBonusPoints
      : -this.otpPenaltyPoints;

    this.awardPoints({
      detail: {
        points,
        type: 'otp',
      },
    });

    this.displayPopMessage(messages[result], `otp-${result}`);
  }

  /**
   * Activates Contactless Mode after the temporary pickup is collected
   */
  contactlessMode() {
    this.hideContactlessPickup();
    this.activateContactlessMode();
    this.displayPopMessage('Contactless boost', 'contactless');
  }

  /**
   * Enables the temporary Contactless dot collection radius
   */
  activateContactlessMode() {
    this.removeTimer({ detail: { timer: this.contactlessTimer } });
    this.pacman.activateContactlessMode(this.scaledTileSize * 3);
    this.contactlessTimer = new Timer(() => {
      this.pacman.deactivateContactlessMode();
      this.contactlessTimer = undefined;
    }, 5000);
  }

  /**
   * Disables Contactless Mode and clears any pending Contactless timer
   */
  deactivateContactlessMode() {
    this.removeTimer({ detail: { timer: this.contactlessTimer } });
    this.contactlessTimer = undefined;
    this.pacman.deactivateContactlessMode();
  }

  /**
   * Determines the quantity of points to give based on the current combo
   */
  determineComboPoints() {
    return 100 * (2 ** this.ghostCombo);
  }

  /**
   * Upon eating a ghost, award points and temporarily pause movement
   * @param {CustomEvent} e - Contains a target ghost object
   */
  eatGhost(e) {
    const pauseDuration = 1000;
    const { position, measurement } = e.detail.ghost;

    this.pauseTimer({ detail: { timer: this.ghostFlashTimer } });
    this.pauseTimer({ detail: { timer: this.ghostCycleTimer } });
    this.pauseTimer({ detail: { timer: this.fruitTimer } });
    this.soundManager.play('eat_ghost');

    this.scaredGhosts = this.scaredGhosts.filter(
      (ghost) => ghost.name !== e.detail.ghost.name,
    );
    this.eyeGhosts += 1;

    this.ghostCombo += 1;
    const comboPoints = this.determineComboPoints();
    window.dispatchEvent(
      new CustomEvent('awardPoints', {
        detail: {
          points: comboPoints,
        },
      }),
    );
    this.displayText(position, comboPoints, pauseDuration, measurement);
    this.activatePaymentCardVisualState();

    this.allowPacmanMovement = false;
    this.pacman.display = false;
    this.pacman.moving = false;
    e.detail.ghost.moving = false;

    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.animate = false;
      ghostRef.pause(true);
      ghostRef.allowCollision = false;
    });

    new Timer(() => {
      this.soundManager.setAmbience('eyes');

      this.resumeTimer({ detail: { timer: this.ghostFlashTimer } });
      this.resumeTimer({ detail: { timer: this.ghostCycleTimer } });
      this.resumeTimer({ detail: { timer: this.fruitTimer } });
      this.allowPacmanMovement = true;
      this.pacman.display = true;
      this.pacman.moving = true;
      if (e.detail.ghost.clearCaughtVisualState) {
        e.detail.ghost.clearCaughtVisualState();
      }
      e.detail.ghost.display = true;
      e.detail.ghost.moving = true;
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.animate = true;
        ghostRef.pause(false);
        ghostRef.allowCollision = true;
      });
    }, pauseDuration);
  }

  /**
   * Decrements the count of "eye" ghosts and updates the ambience
   */
  restoreGhost() {
    this.eyeGhosts -= 1;

    if (this.eyeGhosts === 0) {
      const sound = this.scaredGhosts.length > 0
        ? 'power_up'
        : this.determineSiren(this.remainingDots);
      this.soundManager.setAmbience(sound);
    }
  }

  /**
   * Displays a pop message if the latest score crossed a new milestone
   * @param {Number} previousPoints
   * @param {Number} currentPoints
   */
  displayPointMilestoneMessages(previousPoints, currentPoints) {
    const crossedMilestones = this.popMessageMilestones.filter(
      (milestone) => (
        previousPoints < milestone.points
        && currentPoints >= milestone.points
        && !this.shownPopMessageMilestones.includes(milestone.points)
      ),
    );

    if (crossedMilestones.length === 0) {
      return;
    }

    crossedMilestones.forEach((milestone) => {
      this.shownPopMessageMilestones.push(milestone.points);
    });

    const latestMilestone = crossedMilestones[crossedMilestones.length - 1];
    this.displayPopMessage(latestMilestone.message, latestMilestone.variant);
  }

  /**
   * Removes the current pop message and any pending removal timer
   */
  clearPopMessage() {
    this.removeTimer({ detail: { timer: this.popMessageTimer } });
    this.popMessageTimer = undefined;

    if (this.popMessage) {
      this.mazeDiv.removeChild(this.popMessage);
      this.popMessage = undefined;
    }
  }

  /**
   * Displays a temporary arcade pop message over the maze
   * @param {String} message
   * @param {String} variant
   * @param {Number} duration
   */
  displayPopMessage(message, variant, duration = 2200) {
    const popMessage = document.createElement('div');

    this.clearPopMessage();

    popMessage.classList.add('pop-message', `pop-message-${variant}`);
    Array.from(message).forEach((letter, index) => {
      const letterSpan = document.createElement('span');
      letterSpan.classList.add('pop-message-letter');
      letterSpan.innerText = letter === ' ' ? '\u00a0' : letter;
      letterSpan.style.animationDelay = `${index * 45}ms`;
      popMessage.appendChild(letterSpan);
    });
    popMessage.style.left = `${this.scaledTileSize * 14}px`;
    popMessage.style.top = `${this.scaledTileSize}px`;

    this.mazeDiv.appendChild(popMessage);
    this.popMessage = popMessage;
    this.popMessageTimer = new Timer(() => {
      if (this.popMessage === popMessage) {
        this.clearPopMessage();
      }
    }, duration);
  }

  /**
   * Creates a temporary div to display points on screen
   * @param {({ left: number, top: number })} position - CSS coordinates to display the points at
   * @param {Number} amount - Amount of points to display
   * @param {Number} duration - Milliseconds to display the points before disappearing
   * @param {Number} width - Image width in pixels
   * @param {Number} height - Image height in pixels
   */
  displayText(position, amount, duration, width, height) {
    const pointsDiv = document.createElement('div');

    pointsDiv.style.position = 'absolute';
    pointsDiv.style.backgroundSize = `${width}px`;
    pointsDiv.style.backgroundImage = 'url(app/style/graphics/'
        + `spriteSheets/text/${amount}.svg`;
    pointsDiv.style.width = `${width}px`;
    pointsDiv.style.height = `${height || width}px`;
    pointsDiv.style.top = `${position.top}px`;
    pointsDiv.style.left = `${position.left}px`;
    pointsDiv.style.zIndex = 2;

    this.mazeDiv.appendChild(pointsDiv);

    if (!this.displayTextItems) {
      this.displayTextItems = [];
    }

    const displayTextItem = {
      attached: true,
      element: pointsDiv,
    };

    displayTextItem.timer = new Timer(() => {
      this.removeDisplayTextItem(displayTextItem);
    }, duration);

    this.displayTextItems.push(displayTextItem);
  }

  /**
   * Removes one temporary text display and its timer
   * @param {({ element: Object, timer?: Object })} displayTextItem
   */
  removeDisplayTextItem(displayTextItem) {
    if (!displayTextItem) {
      return;
    }

    if (displayTextItem.timer) {
      clearTimeout(displayTextItem.timer.timerId);
      this.removeTimer({ detail: { timer: displayTextItem.timer } });
    }

    const displayTextItems = this.displayTextItems || [];
    const isTracked = displayTextItems.includes(displayTextItem);

    if (isTracked && displayTextItem.attached && displayTextItem.element) {
      this.mazeDiv.removeChild(displayTextItem.element);
    }

    this.displayTextItems = displayTextItems.filter(
      (item) => item !== displayTextItem,
    );
  }

  /**
   * Removes all temporary text displays
   */
  clearDisplayText() {
    (this.displayTextItems || []).slice().forEach((displayTextItem) => {
      this.removeDisplayTextItem(displayTextItem);
    });
  }

  /**
   * Pushes a Timer to the activeTimers array
   * @param {({ detail: { timer: Object }})} e
   */
  addTimer(e) {
    this.activeTimers.push(e.detail.timer);
  }

  /**
   * Checks if a Timer with a matching ID exists
   * @param {({ detail: { timer: Object }})} e
   * @returns {Boolean}
   */
  timerExists(e) {
    return !!(e.detail.timer || {}).timerId;
  }

  /**
   * Pauses a timer
   * @param {({ detail: { timer: Object }})} e
   */
  pauseTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.pause(true);
    }
  }

  /**
   * Resumes a timer
   * @param {({ detail: { timer: Object }})} e
   */
  resumeTimer(e) {
    if (this.timerExists(e)) {
      e.detail.timer.resume(true);
    }
  }

  /**
   * Removes a Timer from activeTimers
   * @param {({ detail: { timer: Object }})} e
   */
  removeTimer(e) {
    if (this.timerExists(e)) {
      window.clearTimeout(e.detail.timer.timerId);
      this.activeTimers = this.activeTimers.filter(
        (timer) => timer.timerId !== e.detail.timer.timerId,
      );
    }
  }
}


class GameEngine {
  constructor(maxFps, entityList) {
    this.fpsDisplay = document.getElementById('fps-display');
    this.elapsedMs = 0;
    this.lastFrameTimeMs = 0;
    this.entityList = entityList;
    this.maxFps = maxFps;
    this.timestep = 1000 / this.maxFps;
    this.fps = this.maxFps;
    this.framesThisSecond = 0;
    this.lastFpsUpdate = 0;
    this.frameId = 0;
    this.running = false;
    this.started = false;
  }

  /**
   * Toggles the paused/running status of the game
   * @param {Boolean} running - Whether the game is currently in motion
   */
  changePausedState(running) {
    if (running) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Updates the on-screen FPS counter once per second
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  updateFpsDisplay(timestamp) {
    if (timestamp > this.lastFpsUpdate + 1000) {
      this.fps = (this.framesThisSecond + this.fps) / 2;
      this.lastFpsUpdate = timestamp;
      this.framesThisSecond = 0;
    }
    this.framesThisSecond += 1;
    this.fpsDisplay.textContent = `${Math.round(this.fps)} FPS`;
  }

  /**
   * Calls the draw function for every member of the entityList
   * @param {number} interp - The animation accuracy as a percentage
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  draw(interp, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.draw === 'function') {
        entity.draw(interp);
      }
    });
  }

  /**
   * Calls the update function for every member of the entityList
   * @param {number} elapsedMs - The amount of MS that have passed since the last update
   * @param {Array} entityList - List of entities to be used throughout the game
   */
  update(elapsedMs, entityList) {
    entityList.forEach((entity) => {
      if (typeof entity.update === 'function') {
        entity.update(elapsedMs);
      }
    });
  }

  /**
   * In the event that a ton of unsimulated frames pile up, discard all of these frames
   * to prevent crashing the game
   */
  panic() {
    this.elapsedMs = 0;
  }

  /**
   * Draws an initial frame, resets a few tracking variables related to animation, and calls
   * the mainLoop function to start the engine
   */
  start() {
    if (!this.started) {
      this.started = true;

      this.frameId = requestAnimationFrame((firstTimestamp) => {
        this.draw(1, []);
        this.running = true;
        this.lastFrameTimeMs = firstTimestamp;
        this.lastFpsUpdate = firstTimestamp;
        this.framesThisSecond = 0;

        this.frameId = requestAnimationFrame((timestamp) => {
          this.mainLoop(timestamp);
        });
      });
    }
  }

  /**
   * Stops the engine and cancels the current animation frame
   */
  stop() {
    this.running = false;
    this.started = false;
    cancelAnimationFrame(this.frameId);
  }

  /**
   * The loop which will process all necessary frames to update the game's entities
   * prior to animating them
   */
  processFrames() {
    let numUpdateSteps = 0;
    while (this.elapsedMs >= this.timestep) {
      this.update(this.timestep, this.entityList);
      this.elapsedMs -= this.timestep;
      numUpdateSteps += 1;
      if (numUpdateSteps >= this.maxFps) {
        this.panic();
        break;
      }
    }
  }

  /**
   * A single cycle of the engine which checks to see if enough time has passed, and, if so,
   * will kick off the loops to update and draw the game's entities.
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  engineCycle(timestamp) {
    if (timestamp < this.lastFrameTimeMs + (1000 / this.maxFps)) {
      this.frameId = requestAnimationFrame((nextTimestamp) => {
        this.mainLoop(nextTimestamp);
      });
      return;
    }

    this.elapsedMs += timestamp - this.lastFrameTimeMs;
    this.lastFrameTimeMs = timestamp;
    this.updateFpsDisplay(timestamp);
    this.processFrames();
    this.draw(this.elapsedMs / this.timestep, this.entityList);

    this.frameId = requestAnimationFrame((nextTimestamp) => {
      this.mainLoop(nextTimestamp);
    });
  }

  /**
   * The endless loop which will kick off engine cycles so long as the game is running
   * @param {number} timestamp - The amount of MS which has passed since starting the game engine
   */
  mainLoop(timestamp) {
    this.engineCycle(timestamp);
  }
}


/* istanbul ignore file */
(function nexiModeBootstrap() {
  if (typeof GameCoordinator === 'undefined' || typeof Pickup === 'undefined') {
    return;
  }

  const nexiFruitImages = {
    100: 'card_contactless',
    300: 'card_coral',
    500: 'card_virtual',
    700: 'card_business',
    1000: 'token_secure',
    2000: 'token_premium',
    3000: 'token_black',
    5000: 'token_vault',
  };

  const ghostLabels = {
    blinky: 'Chargeback',
    pinky: 'Phishing',
    inky: 'Skimmer',
    clyde: 'Spoof Bot',
  };

  const originalPreloadAssets = GameCoordinator.prototype.preloadAssets;
  const originalStartButtonClick = GameCoordinator.prototype.startButtonClick;
  const originalPowerUp = GameCoordinator.prototype.powerUp;
  const originalAwardPoints = GameCoordinator.prototype.awardPoints;
  const originalReset = GameCoordinator.prototype.reset;
  const originalEatGhost = GameCoordinator.prototype.eatGhost;
  const originalSetUiDimensions = GameCoordinator.prototype.setUiDimensions;
  const originalReturnHomeClick = GameCoordinator.prototype.returnHomeClick;
  const originalSetStyleMeasurements = Pickup.prototype.setStyleMeasurements;
  const startBootDuration = 1100;
  const posCardSwipeDelay = 950;
  const posCardSwipeDuration = 2000;
  let posCardSwipeTimeout;

  function scheduleFit(gameCoordinator) {
    if (!gameCoordinator || typeof gameCoordinator.fitGameToPosScreen !== 'function') {
      return;
    }

    const gameCoordinatorRef = gameCoordinator;
    window.cancelAnimationFrame(gameCoordinatorRef.fitAnimationFrame);
    gameCoordinatorRef.fitAnimationFrame = window.requestAnimationFrame(() => {
      gameCoordinatorRef.fitGameToPosScreen();
    });
  }

  function scheduleFitBurst(gameCoordinator) {
    const delays = [0, 80, 250, 600];

    delays.forEach((delay) => {
      window.setTimeout(() => {
        scheduleFit(gameCoordinator);
      }, delay);
    });
  }

  function setStartTerminalMessage(gameCoordinator, topLine, bottomLine) {
    if (!gameCoordinator || !gameCoordinator.gameStartButton) {
      return;
    }

    const screenLines = gameCoordinator.gameStartButton.querySelectorAll('.atm-screen-line');

    if (screenLines[0] && typeof topLine === 'string') {
      screenLines[0].textContent = topLine;
    }

    if (screenLines[1] && typeof bottomLine === 'string') {
      screenLines[1].textContent = bottomLine;
    }
  }

  function resetStartTerminal(gameCoordinator) {
    if (!gameCoordinator || !gameCoordinator.gameStartButton) {
      return;
    }

    const { gameStartButton } = gameCoordinator;

    gameStartButton.classList.remove('game-start--booting');
    gameStartButton.disabled = false;
    setStartTerminalMessage(gameCoordinator, 'INSERT CARD', '▶ PRESS PLAY');
  }

  function playPosCardSwipe(gameCoordinator) {
    const posShell = gameCoordinator && document.querySelector('.pos-shell');

    if (!posShell) {
      return;
    }

    window.clearTimeout(posCardSwipeTimeout);
    posShell.classList.remove('pos-shell--card-swipe');
    posShell.getBoundingClientRect();
    posShell.classList.add('pos-shell--card-swipe');

    posCardSwipeTimeout = window.setTimeout(() => {
      posShell.classList.remove('pos-shell--card-swipe');
    }, posCardSwipeDuration);
  }

  Pickup.prototype.determineImage = function determineNexiImage(type, points) {
    let image;

    if (type === 'fruit') {
      image = nexiFruitImages[points] || 'card_contactless';
    } else if (type === 'powerPellet') {
      image = this.powerPelletVariant || 'power_card_blue';
    } else if (type === 'contactless') {
      image = 'card_contactless';
    } else if (type === 'otp') {
      return 'url(app/style/graphics/spriteSheets/pickups/otp.svg)';
    } else if (type === 'pacdot') {
      return 'url(app/style/graphics/spriteSheets/pickups/pacdot.svg)';
    } else {
      return 'url(app/style/graphics/spriteSheets/pickups/pacdot.svg)';
    }

    return `url(app/style/graphics/nexi/${image}.svg)`;
  };

  Pickup.prototype.setStyleMeasurements = function patchedSetStyleMeasurements(
    type,
    scaledTileSize,
    column,
    row,
    points,
  ) {
    if (type === 'powerPellet') {
      const variants = {
        '1,3': 'power_card_blue',
        '26,3': 'power_card_gold',
        '1,23': 'power_card_gray',
        '26,23': 'power_card_black',
      };
      this.powerPelletVariant = variants[`${column},${row}`] || 'power_card_blue';
    }

    originalSetStyleMeasurements.call(
      this,
      type,
      scaledTileSize,
      column,
      row,
      points,
    );

    if (type === 'powerPellet') {
      this.size = scaledTileSize * 0.9;
      this.x = (column * scaledTileSize) + (scaledTileSize * 0.05);
      this.y = (row * scaledTileSize) + (scaledTileSize * 0.05);
      this.animationTarget.style.backgroundSize = `${this.size}px`;
      this.animationTarget.style.height = `${this.size}px`;
      this.animationTarget.style.width = `${this.size}px`;
      this.animationTarget.style.top = `${this.y}px`;
      this.animationTarget.style.left = `${this.x}px`;
    }
  };

  function determineBannerVariant(message) {
    const variants = {
      'Carta Nexi accettata': 'nexi-card',
      'Anti-fraud shield online': 'nexi-security',
      'Demo live sul POS': 'nexi-demo',
    };

    return variants[message] || 'nexi-info';
  }

  GameCoordinator.prototype.setupNexiBranding = function setupNexiBranding() {
    const status = document.getElementById('nexi-status');
    this.nexiStatus = status;

    Object.keys(ghostLabels).forEach((ghostId) => {
      const element = document.getElementById(ghostId);
      if (element) {
        element.dataset.label = ghostLabels[ghostId];
      }
    });
  };

  GameCoordinator.prototype.setStatus = function setStatus(message) {
    if (this.nexiStatus) {
      this.nexiStatus.textContent = message;
    }
  };

  GameCoordinator.prototype.showBanner = function showBanner(message, duration) {
    if (typeof this.displayPopMessage !== 'function') {
      return;
    }

    this.displayPopMessage(message, determineBannerVariant(message), duration);
  };

  GameCoordinator.prototype.showScoreReason = function showScoreReason(points, reason) {
    if (typeof this.displayPopMessage !== 'function') {
      return;
    }

    this.displayPopMessage(`+${points} IOSI`, 'nexi-score', 1800);
    this.setStatus(reason);
  };

  GameCoordinator.prototype.fitGameToPosScreen = function fitGameToPosScreen() {
    const posShell = document.querySelector('.pos-shell');
    const screen = document.getElementById('pos-screen-inner');
    if (!posShell || !screen || !this.gameUi) {
      return;
    }

    this.gameUi.style.transform = 'scale(1)';
    this.gameUi.style.left = '0px';
    this.gameUi.style.top = '0px';
    this.gameUi.style.height = 'auto';
    this.gameUi.style.minHeight = '0px';
    if (this.gameBaseWidth) {
      this.gameUi.style.minWidth = `${this.gameBaseWidth}px`;
      this.gameUi.style.width = `${this.gameBaseWidth}px`;
    }

    const baseContentWidth = Math.max(
      this.gameBaseWidth || 0,
      this.gameUi.offsetWidth,
      this.gameUi.scrollWidth,
    );
    const contentHeight = Math.max(
      this.gameUi.offsetHeight,
      this.gameUi.scrollHeight,
    );

    if (!baseContentWidth || !contentHeight) {
      return;
    }

    posShell.style.width = '';

    const screenWidth = screen.clientWidth;
    const screenHeight = screen.clientHeight;
    const fitPadding = Math.max(
      Math.min(screenWidth, screenHeight) * 0.015,
      window.innerWidth <= 600 ? 3 : 4,
    );
    const innerWidth = Math.max(screenWidth - (fitPadding * 2), 0);
    const innerHeight = Math.max(screenHeight - (fitPadding * 2), 0);

    const scale = Math.min(
      innerWidth / baseContentWidth,
      innerHeight / contentHeight,
    );
    const fittedContentWidth = Math.max(
      baseContentWidth,
      Math.floor(innerWidth / scale),
    );

    this.gameUi.style.width = `${fittedContentWidth}px`;
    this.gameUi.style.transform = `scale(${scale})`;
    this.gameUi.style.left = `${(screenWidth - (fittedContentWidth * scale)) / 2}px`;
    this.gameUi.style.top = `${(screenHeight - (contentHeight * scale)) / 2}px`;
  };

  GameCoordinator.prototype.startAttractMode = function startAttractMode() {
    if (this.demoModeStarted) {
      return;
    }

    this.demoModeStarted = true;
    this.demoMode = true;
    this.leftCover.style.left = '-50%';
    this.rightCover.style.right = '-50%';
    this.mainMenu.classList.add('demo-visible');

    this.reset();
    if (this.firstGame) {
      this.firstGame = false;
      this.init();
    }

    this.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.allowCollision = false;
    });

    this.startGameplay(false);
    this.setStatus('Attract mode attivo. Tocca la carta per iniziare.');
    this.showBanner('Demo live sul POS', 2200);

    const directions = ['up', 'left', 'down', 'right'];
    this.demoDriver = window.setInterval(() => {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      this.changeDirection(direction);
    }, 650);
  };

  GameCoordinator.prototype.stopAttractMode = function stopAttractMode() {
    this.demoMode = false;
    this.demoModeStarted = false;
    this.mainMenu.classList.remove('demo-visible');
    if (Array.isArray(this.activeTimers)) {
      this.activeTimers.forEach((timer) => {
        if (timer && timer.timerId) {
          window.clearTimeout(timer.timerId);
        }
      });
      this.activeTimers = [];
    }
    window.clearInterval(this.demoDriver);
    this.demoDriver = null;
  };

  GameCoordinator.prototype.preloadAssets = function patchedPreloadAssets() {
    const result = originalPreloadAssets.call(this);

    if (result && typeof result.then === 'function') {
      result.then(() => {
        this.setupNexiBranding();
        window.addEventListener('resize', () => {
          scheduleFit(this);
        });

        if (typeof ResizeObserver !== 'undefined') {
          this.posScreenObserver = new ResizeObserver(() => {
            scheduleFit(this);
          });

          const posShell = document.querySelector('.pos-shell');
          const posScreen = document.querySelector('.pos-screen');

          if (posShell) {
            this.posScreenObserver.observe(posShell);
          }

          if (posScreen) {
            this.posScreenObserver.observe(posScreen);
          }
        }

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            scheduleFitBurst(this);
          });
        }

        window.addEventListener('load', () => {
          scheduleFitBurst(this);
        });

        scheduleFitBurst(this);

        window.setTimeout(() => {
          this.startAttractMode();
        }, 1700);
      });
    }

    return result;
  };

  GameCoordinator.prototype.reset = function patchedReset() {
    originalReset.call(this);
    scheduleFitBurst(this);

    if (this.demoMode) {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.allowCollision = false;
      });
    }
  };

  GameCoordinator.prototype.startButtonClick = function patchedStartButtonClick() {
    if (this.startBooting) {
      return;
    }

    this.startBooting = true;
    this.gameStartButton.classList.add('game-start--booting');
    this.gameStartButton.disabled = true;
    setStartTerminalMessage(this, 'READING CARD', 'BOOTING POS...');

    if (this.demoMode) {
      this.stopAttractMode();
      this.setStatus('Carta autorizzata. Sessione di pagamento avviata.');
      this.showBanner('Carta Nexi accettata', 2000);
    } else {
      this.setStatus('Sessione live. Ferma i frodatori.');
    }

    window.setTimeout(() => {
      this.startBooting = false;
      originalStartButtonClick.call(this);
      window.setTimeout(() => {
        playPosCardSwipe(this);
      }, posCardSwipeDelay);
    }, startBootDuration);
  };

  GameCoordinator.prototype.returnHomeClick = function patchedReturnHomeClick() {
    originalReturnHomeClick.call(this);
    this.startBooting = false;
    window.clearTimeout(posCardSwipeTimeout);
    posCardSwipeTimeout = undefined;
    const posShell = document.querySelector('.pos-shell');
    if (posShell) {
      posShell.classList.remove('pos-shell--card-swipe');
    }
    resetStartTerminal(this);
  };

  GameCoordinator.prototype.powerUp = function patchedPowerUp() {
    this.setStatus('Scudo antifrode attivo.');
    this.showBanner('Anti-fraud shield online', 2400);
    originalPowerUp.call(this);
  };

  GameCoordinator.prototype.awardPoints = function patchedAwardPoints(event) {
    originalAwardPoints.call(this, event);

    if (!event.detail || !event.detail.type) {
      return;
    }

    if (event.detail.type === 'fruit') {
      this.setStatus(`Carta premium acquisita: +${event.detail.points} IOSI.`);
    } else if (event.detail.type === 'powerPellet') {
      this.setStatus('Token antifrode raccolto.');
    }
  };

  GameCoordinator.prototype.eatGhost = function patchedEatGhost(event) {
    const nextCombo = (this.ghostCombo || 0) + 1;
    const comboPoints = 100 * (2 ** nextCombo);
    const { ghost } = event.detail || {};
    const fraudLabel = ghost && ghost.animationTarget
      ? ghost.animationTarget.dataset.label
      : 'Frodatore';

    this.showScoreReason(
      comboPoints,
      `Hai mangiato un frodatore: ${fraudLabel}`,
    );
    this.setStatus(`Frode bloccata: ${fraudLabel}. Bonus +${comboPoints} IOSI.`);
    originalEatGhost.call(this, event);
  };

  GameCoordinator.prototype.setUiDimensions = function patchedSetUiDimensions() {
    originalSetUiDimensions.call(this);
    scheduleFitBurst(this);
  };
}());
