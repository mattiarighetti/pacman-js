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

// removeIf(production)
module.exports = GameCoordinator;
// endRemoveIf(production)
