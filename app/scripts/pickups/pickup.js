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

// removeIf(production)
module.exports = Pickup;
// endRemoveIf(production)
