const assert = require('assert');
const fs = require('fs');

describe('homepage', () => {
  it('does not render intro feature chip text', () => {
    const html = fs.readFileSync('index.html', 'utf8');

    assert(!html.includes('Contactless'));
    assert(!html.includes('Anti-fraud'));
    assert(!html.includes('Instant score'));
  });

  it('renders homepage options as a modal without a back button', () => {
    const html = fs.readFileSync('index.html', 'utf8');

    assert(html.includes("id='home-options-panel'"));
    assert(html.includes("role='dialog'"));
    assert(html.includes("aria-modal='true'"));
    assert(html.includes("id='home-options-close'"));
    assert(!html.includes("id='home-options-back'"));
    assert(!html.includes('INDIETRO'));
  });

  it('renders the start button without the Nexi logo', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const startButton = html.match(/<button id='game-start'[\s\S]*?<\/button>/)[0];

    assert(!startButton.includes('atm-logo'));
    assert(!startButton.includes('nexi-logo-white.svg'));
    assert(!startButton.includes("alt='Nexi'"));
  });

  it('renders matching menu action icons for options and leaderboard', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const optionsButton = html.match(/<button id='home-options-button'[\s\S]*?<\/button>/)[0];
    const leaderboardLink = html.match(/<a href='leaderboard.html'[\s\S]*?<\/a>/)[0];

    assert(/class='[^']*menu-action-icon[^']*'/.test(optionsButton));
    assert(/class='[^']*menu-action-icon[^']*'/.test(leaderboardLink));
    assert(optionsButton.includes('material-icons'));
    assert(optionsButton.includes('settings'));
    assert(optionsButton.includes("aria-hidden='true'"));
    assert(leaderboardLink.includes("aria-hidden='true'"));
  });

  it('keeps menu action icons at 20 by 20 pixels', () => {
    const scss = fs.readFileSync('app/style/scss/mainPage.scss', 'utf8');
    const iconRule = scss.match(/\.menu-action-icon \{[\s\S]*?\n\}/);

    assert(iconRule);
    assert(iconRule[0].includes('height: 20px;'));
    assert(iconRule[0].includes('width: 20px;'));
  });

  it('adds extra spacing between the play button and secondary menu actions', () => {
    const scss = fs.readFileSync('app/style/scss/mainPage.scss', 'utf8');
    const gameStartRule = scss.match(/\.game-start \{[\s\S]*?\n\}/)[0];

    assert(gameStartRule.includes('margin-bottom: 1rem;'));
  });

  it('keeps the loading bar black over the solid Nexi blue cover', () => {
    const scss = fs.readFileSync('app/style/scss/mainPage.scss', 'utf8');
    const nexiCss = fs.readFileSync('app/style/nexi-theme.css', 'utf8');
    const loadingContainerRule = scss.match(/\.loading-container \{[\s\S]*?\n\}/)[0];
    const loadingPacmanRule = scss.match(/\.loading-pacman \{[\s\S]*?\n\}/)[0];
    const loadingDotMaskRule = scss.match(/\.loading-dot-mask \{[\s\S]*?\n\}/)[0];
    const loadingCoverRule = nexiCss.match(/\.loading-cover \{[\s\S]*?\n\}/)[0];

    assert(loadingContainerRule.includes('background-color: $black;'));
    assert(loadingPacmanRule.includes('background-color: $black;'));
    assert(loadingDotMaskRule.includes('background-color: $black;'));
    assert(loadingCoverRule.includes('background: #2d32aa;'));
    assert(!loadingCoverRule.includes('linear-gradient'));
  });
});
