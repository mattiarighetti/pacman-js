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
});
