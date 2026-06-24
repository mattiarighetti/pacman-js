const assert = require('assert');
const sinon = require('sinon');
const Pickup = require('../scripts/pickups/pickup');

let pickup;
let pacman;
let mazeDiv;
let previousEvent;
let previousCustomEvent;

const findDispatchedEvent = (type) => global.window.dispatchEvent
  .getCalls()
  .map((call) => call.args[0])
  .find((event) => event.type === type);

beforeEach(() => {
  previousEvent = global.Event;
  previousCustomEvent = global.CustomEvent;
  global.Event = class {
    constructor(type) {
      this.type = type;
    }
  };
  global.CustomEvent = class extends global.Event {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  };
  global.document = {
    createElement: () => ({
      classList: {
        add: () => { },
      },
      style: {},
    }),
  };

  pacman = {
    position: {
      top: 10,
      left: 10,
    },
    measurement: 16,
  };

  mazeDiv = {
    appendChild: () => { },
  };

  pickup = new Pickup('pacdot', 8, 1, 1, pacman, mazeDiv);
});

afterEach(() => {
  global.Event = previousEvent;
  global.CustomEvent = previousCustomEvent;
});

describe('pickup', () => {
  describe('reset', () => {
    it('sets visibility according to type', () => {
      pickup.animationTarget.style.visibility = 'blah';

      pickup.type = 'pacdot';
      pickup.reset();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'visible');

      pickup.type = 'fruit';
      pickup.reset();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');

      pickup.type = 'contactless';
      pickup.reset();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');

      pickup.type = 'otp';
      pickup.reset();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');
    });
  });

  describe('setStyleMeasurements', () => {
    it('sets measurements for pacdots', () => {
      pickup.setStyleMeasurements('pacdot', 8, 1, 1);

      assert.strictEqual(pickup.size, 2);
      assert.strictEqual(pickup.x, 11);
      assert.strictEqual(pickup.y, 11);
      assert.deepEqual(pickup.animationTarget.style, {
        backgroundImage: 'url(app/style/graphics/spriteSheets/pickups/pacdot.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '2px 2px',
        height: '2px',
        left: '11px',
        position: 'absolute',
        top: '11px',
        visibility: 'visible',
        width: '2px',
      });
    });

    it('sets measurements for powerPellets', () => {
      pickup.setStyleMeasurements('powerPellet', 8, 1, 1);

      assert.strictEqual(pickup.size, 8);
      assert.strictEqual(pickup.x, 8);
      assert.strictEqual(pickup.y, 8);
      assert.deepEqual(pickup.animationTarget.style, {
        backgroundImage: 'url(app/style/graphics/nexi/power_card_blue.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '8px 8px',
        height: '8px',
        left: '8px',
        position: 'absolute',
        top: '8px',
        visibility: 'visible',
        width: '8px',
      });
    });

    it('sets measurements for fruits', () => {
      pickup.type = 'fruit';
      pickup.setStyleMeasurements('fruit', 8, 1, 1, 100);

      assert.strictEqual(pickup.size, 16);
      assert.strictEqual(pickup.x, 4);
      assert.strictEqual(pickup.y, 6.666666666666667);
      assert.deepEqual(pickup.animationTarget.style, {
        backgroundImage: 'url(app/style/graphics/nexi/card_contactless.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '16px 10.666666666666666px',
        height: '10.666666666666666px',
        left: '4px',
        position: 'absolute',
        top: '6.666666666666667px',
        width: '16px',
        visibility: 'hidden',
      });
    });

    it('sets measurements for contactless pickups', () => {
      pickup.type = 'contactless';
      pickup.setStyleMeasurements('contactless', 8, 1, 1);

      assert.strictEqual(pickup.size, 16);
      assert.strictEqual(pickup.x, 4);
      assert.strictEqual(pickup.y, 6.666666666666667);
      assert.deepEqual(pickup.animationTarget.style, {
        backgroundImage: 'url(app/style/graphics/nexi/card_contactless.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '16px 10.666666666666666px',
        height: '10.666666666666666px',
        left: '4px',
        position: 'absolute',
        top: '6.666666666666667px',
        width: '16px',
        visibility: 'hidden',
      });
    });

    it('sets measurements for OTP pickups', () => {
      pickup.type = 'otp';
      pickup.setStyleMeasurements('otp', 8, 1, 1);

      assert.strictEqual(pickup.size, 16);
      assert.strictEqual(pickup.x, 4);
      assert.strictEqual(pickup.y, 6.666666666666667);
      assert.deepEqual(pickup.animationTarget.style, {
        backgroundImage: 'url(app/style/graphics/spriteSheets/pickups/'
         + 'otp.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '16px 10.666666666666666px',
        height: '10.666666666666666px',
        left: '4px',
        position: 'absolute',
        top: '6.666666666666667px',
        width: '16px',
        visibility: 'hidden',
      });
    });
  });

  describe('determineImage', () => {
    let baseUrl;

    beforeEach(() => {
      baseUrl = 'url(app/style/graphics/nexi/';
    });

    it('returns correct images for fruits', () => {
      assert.strictEqual(
        pickup.determineImage('fruit', 100),
        `${baseUrl}card_contactless.svg)`,
      );

      assert.strictEqual(
        pickup.determineImage('fruit', 300),
        `${baseUrl}card_coral.svg)`,
      );

      assert.strictEqual(
        pickup.determineImage('fruit', 500),
        `${baseUrl}card_virtual.svg)`,
      );

      assert.strictEqual(
        pickup.determineImage('fruit', 700),
        `${baseUrl}card_business.svg)`,
      );

      assert.strictEqual(
        pickup.determineImage('fruit', 1000),
        `${baseUrl}token_secure.svg)`,
      );

      assert.strictEqual(
        pickup.determineImage('fruit', 2000),
        `${baseUrl}token_premium.svg)`,
      );

      assert.strictEqual(
        pickup.determineImage('fruit', 3000),
        `${baseUrl}token_black.svg)`,
      );

      assert.strictEqual(
        pickup.determineImage('fruit', 5000),
        `${baseUrl}token_vault.svg)`,
      );
    });

    it('returns a contactless card by default for unrecognized fruit', () => {
      const unknown = pickup.determineImage('fruit', undefined);
      assert.strictEqual(unknown, `${baseUrl}card_contactless.svg)`);
    });

    it('returns payment images for other pickups', () => {
      const pacdot = pickup.determineImage('pacdot', undefined);
      assert.strictEqual(
        pacdot,
        'url(app/style/graphics/spriteSheets/pickups/pacdot.svg)',
      );

      const powerPellet = pickup.determineImage('powerPellet', undefined);
      assert.strictEqual(powerPellet, `${baseUrl}power_card_blue.svg)`);

      const contactless = pickup.determineImage('contactless', undefined);
      assert.strictEqual(contactless, `${baseUrl}card_contactless.svg)`);

      const otp = pickup.determineImage('otp', undefined);
      assert.strictEqual(
        otp,
        'url(app/style/graphics/spriteSheets/pickups/otp.svg)',
      );

      const unrecognized = pickup.determineImage('unknown', undefined);
      assert.strictEqual(
        unrecognized,
        'url(app/style/graphics/spriteSheets/pickups/pacdot.svg)',
      );
    });
  });

  describe('showFruit', () => {
    it('sets the point value, image, and visibility', () => {
      pickup.points = 0;
      pickup.animationTarget.style.backgroundImage = '';
      pickup.animationTarget.style.visibility = '';
      pickup.determineImage = sinon.fake.returns('svg');

      pickup.showFruit(100);
      assert.strictEqual(pickup.points, 100);
      assert.strictEqual(pickup.animationTarget.style.backgroundImage, 'svg');
      assert.strictEqual(pickup.animationTarget.style.visibility, 'visible');
    });
  });

  describe('hideFruit', () => {
    it('sets the visibility to HIDDEN', () => {
      pickup.animationTarget.style.visibility = 'visible';

      pickup.hideFruit();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');
    });
  });

  describe('showContactless', () => {
    it('sets position, image, and visibility', () => {
      pickup.type = 'contactless';
      pickup.animationTarget.style.visibility = 'hidden';

      pickup.showContactless(5, 6, 8);
      assert.strictEqual(pickup.size, 16);
      assert.strictEqual(pickup.x, 36);
      assert.strictEqual(pickup.y, 46.666666666666664);
      assert.deepEqual(pickup.center, {
        x: 40,
        y: 48,
      });
      assert.strictEqual(
        pickup.animationTarget.style.backgroundImage,
        'url(app/style/graphics/nexi/card_contactless.svg)',
      );
      assert.strictEqual(pickup.animationTarget.style.visibility, 'visible');
    });
  });

  describe('hideContactless', () => {
    it('sets the visibility to HIDDEN', () => {
      pickup.animationTarget.style.visibility = 'visible';

      pickup.hideContactless();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');
    });
  });

  describe('showOtp', () => {
    it('sets position, image, and visibility', () => {
      pickup.type = 'otp';
      pickup.animationTarget.style.visibility = 'hidden';

      pickup.showOtp(5, 6, 8);
      assert.strictEqual(pickup.size, 16);
      assert.strictEqual(pickup.x, 36);
      assert.strictEqual(pickup.y, 46.666666666666664);
      assert.deepEqual(pickup.center, {
        x: 40,
        y: 48,
      });
      assert.strictEqual(
        pickup.animationTarget.style.backgroundImage,
        'url(app/style/graphics/spriteSheets/pickups/otp.svg)',
      );
      assert.strictEqual(pickup.animationTarget.style.visibility, 'visible');
    });
  });

  describe('hideOtp', () => {
    it('sets the visibility to HIDDEN', () => {
      pickup.animationTarget.style.visibility = 'visible';

      pickup.hideOtp();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');
    });
  });

  describe('checkForCollision', () => {
    it('returns TRUE if the Pickup is colliding', () => {
      assert(pickup.checkForCollision(
        { x: 7.4, y: 7.4, size: 5 },
        { x: 0, y: 0, size: 10 },
      ));
    });

    it('returns FALSE if it is not', () => {
      assert(!pickup.checkForCollision(
        { x: 7.5, y: 7.5, size: 5 },
        { x: 0, y: 0, size: 10 },
      ));
    });
  });

  describe('checkPacmanProximity', () => {
    beforeEach(() => {
      pickup.center = { x: 0, y: 0 };
    });

    it('returns TRUE if the pickup is close to Pacman', () => {
      pickup.checkPacmanProximity(5, { x: 3, y: 4 });
      assert(pickup.nearPacman);
    });

    it('returns FALSE otherwise', () => {
      pickup.checkPacmanProximity(4.9, { x: 3, y: 4 });
      assert(!pickup.nearPacman);
    });

    it('sets background color when debugging', () => {
      pickup.checkPacmanProximity(5, { x: 3, y: 4 }, true);
      assert.strictEqual(pickup.animationTarget.style.background, 'lime');

      pickup.checkPacmanProximity(4.9, { x: 3, y: 4 }, true);
      assert.strictEqual(pickup.animationTarget.style.background, 'red');
    });

    it('skips execution if the pickup is hidden', () => {
      pickup.animationTarget.style.visibility = 'hidden';
      pickup.nearPacman = false;

      pickup.checkPacmanProximity(5, { x: 3, y: 4 });
      assert(!pickup.nearPacman);
    });
  });

  describe('shouldCheckForCollision', () => {
    it('only returns TRUE when the Pickup is near Pacman and visible', () => {
      pickup.animationTarget.style.visibility = 'visible';
      pickup.nearPacman = true;
      assert(pickup.shouldCheckForCollision());

      pickup.nearPacman = false;
      assert(!pickup.shouldCheckForCollision());

      pickup.animationTarget.style.visibility = 'hidden';
      assert(!pickup.shouldCheckForCollision());

      pickup.nearPacman = true;
      assert(!pickup.shouldCheckForCollision());
    });
  });

  describe('shouldCollectContactless', () => {
    beforeEach(() => {
      pickup.center = { x: 18, y: 18 };
      pacman.contactlessRadius = 12;
    });

    it('returns TRUE for visible pacdots inside the contactless radius', () => {
      pickup.animationTarget.style.visibility = 'visible';

      assert(pickup.shouldCollectContactless());
    });

    it('returns FALSE for pacdots outside the contactless radius', () => {
      pickup.center = { x: 30, y: 30 };
      pickup.animationTarget.style.visibility = 'visible';

      assert(!pickup.shouldCollectContactless());
    });

    it('returns FALSE when Contactless Mode is inactive', () => {
      pacman.contactlessRadius = 0;
      pickup.animationTarget.style.visibility = 'visible';

      assert(!pickup.shouldCollectContactless());
    });

    it('returns FALSE when the pickup is hidden', () => {
      pickup.animationTarget.style.visibility = 'hidden';

      assert(!pickup.shouldCollectContactless());
    });

    it('returns FALSE for non-pacdot pickups', () => {
      pickup.type = 'powerPellet';
      pickup.animationTarget.style.visibility = 'visible';

      assert(!pickup.shouldCollectContactless());
    });
  });

  describe('update', () => {
    beforeEach(() => {
      global.window = {
        dispatchEvent: sinon.fake(),
      };
    });

    it('turns the Pickup\'s visibility to HIDDEN after collision', () => {
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');
    });

    it('leaves the Pickup\'s visibility until collision', () => {
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(false);

      pickup.update();
      assert.notStrictEqual(pickup.animationTarget.style.visibility, 'hidden');
    });

    it('emits the awardPoints event after a collision', () => {
      pickup.points = 100;
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert.deepStrictEqual(findDispatchedEvent('awardPoints').detail, {
        points: pickup.points,
        type: pickup.type,
      });
    });

    it('emits dotEaten event if a pacdot collides with Pacman', () => {
      pickup.type = 'pacdot';
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert(findDispatchedEvent('dotEaten'));
    });

    it('emits powerUp event if a powerPellet collides with Pacman', () => {
      pickup.type = 'powerPellet';
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert(findDispatchedEvent('dotEaten'));
      assert(findDispatchedEvent('powerUp'));
    });

    it('emits only awardPoints if a fruit collides with Pacman', () => {
      pickup.type = 'fruit';
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert(global.window.dispatchEvent.calledOnce);
      assert.deepStrictEqual(findDispatchedEvent('awardPoints').detail, {
        points: pickup.points,
        type: pickup.type,
      });
    });

    it('emits no events if an unrecognized item collides with Pacman', () => {
      pickup.type = 'blah';
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert(!global.window.dispatchEvent.called);
    });

    it('emits contactlessMode if a contactless pickup collides with Pacman', () => {
      pickup.type = 'contactless';
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert.strictEqual(findDispatchedEvent('contactlessMode').type, 'contactlessMode');
    });

    it('emits otpMode if an OTP pickup collides with Pacman', () => {
      pickup.type = 'otp';
      pickup.shouldCheckForCollision = sinon.fake.returns(true);
      pickup.checkForCollision = sinon.fake.returns(true);

      pickup.update();
      assert.strictEqual(findDispatchedEvent('otpMode').type, 'otpMode');
    });

    it('collects visible pacdots inside the Contactless radius', () => {
      pickup.type = 'pacdot';
      pickup.points = 10;
      pickup.animationTarget.style.visibility = 'visible';
      pickup.shouldCheckForCollision = sinon.fake.returns(false);
      pickup.shouldCollectContactless = sinon.fake.returns(true);

      pickup.update();
      assert.strictEqual(pickup.animationTarget.style.visibility, 'hidden');
      assert(findDispatchedEvent('dotEaten'));
    });

    it('does nothing if shouldCheckForCollision returns FALSE', () => {
      pickup.shouldCheckForCollision = sinon.fake.returns(false);
      pickup.checkForCollision = sinon.fake();
      pickup.shouldCollectContactless = sinon.fake.returns(false);

      pickup.update();
      assert(!pickup.checkForCollision.called);
    });
  });
});
