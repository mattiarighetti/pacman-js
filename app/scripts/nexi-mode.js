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
  const originalSetStyleMeasurements = Pickup.prototype.setStyleMeasurements;

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

  Pickup.prototype.determineImage = function determineNexiImage(type, points) {
    let image;

    if (type === 'fruit') {
      image = nexiFruitImages[points] || 'card_contactless';
    } else if (type === 'powerPellet') {
      image = this.powerPelletVariant || 'power_card_blue';
    } else if (type === 'contactless') {
      image = 'card_contactless';
    } else {
      image = 'payment_dot';
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
    const contentWidth = this.gameUi.offsetWidth;
    const contentHeight = this.gameUi.offsetHeight;

    if (!contentWidth || !contentHeight) {
      return;
    }

    const viewportMargin = window.innerWidth <= 600 ? 16 : 32;
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
      innerWidth / contentWidth,
      innerHeight / contentHeight,
    );

    this.gameUi.style.transform = `scale(${scale})`;
    this.gameUi.style.left = `${(screenWidth - (contentWidth * scale)) / 2}px`;
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

        window.setTimeout(() => {
          this.startAttractMode();
        }, 1700);
      });
    }

    return result;
  };

  GameCoordinator.prototype.reset = function patchedReset() {
    originalReset.call(this);
    scheduleFit(this);

    if (this.demoMode) {
      this.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.allowCollision = false;
      });
    }
  };

  GameCoordinator.prototype.startButtonClick = function patchedStartButtonClick() {
    if (this.demoMode) {
      this.stopAttractMode();
      this.setStatus('Carta autorizzata. Sessione di pagamento avviata.');
      this.showBanner('Carta Nexi accettata', 2000);
    } else {
      this.setStatus('Sessione live. Ferma i frodatori.');
    }

    originalStartButtonClick.call(this);
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
    scheduleFit(this);
  };
}());
