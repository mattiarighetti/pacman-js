# AGENTS.md

## Project Overview

- This repository is `pacman-js`, a browser-based Pac-Man clone built with plain JavaScript, HTML, SCSS, and static assets.
- The app runs from `index.html`, which loads the generated files `build/app.css` and `build/app.js`.
- Source code lives under `app/scripts` and `app/style/scss`; assets live under `app/style/graphics` and `app/style/audio`.
- `build/` is generated output. Do not hand-edit `build/app.js` or `build/app.css`; update sources and run the Gulp build/watch task.

## Runtime And Tooling

- Use the project-local Node/npm setup. Do not install dependencies globally.
- Declared minimums are Node `>=12.18.3` and npm `>=6.14.6`; CI currently runs Node `20.x`.
- Install dependencies with `npm ci` for clean installs or `npm i` for normal local development.
- Useful commands:
  - `npm run watch`: compiles JS and SCSS continuously through Gulp.
  - `npm run serve`: serves the static files locally with `http-server`.
  - `npm run lint`: runs ESLint with Airbnb base rules.
  - `npm test`: runs Mocha tests through NYC with 100% coverage thresholds, then refreshes `coverage/coverage-summary.json`.
- Local gameplay is expected at `http://127.0.0.1:8080/index` after watch/build and serve are running.

## Build Model

- `gulpfile.js` defines two build paths:
  - SCSS from `app/style/scss/**/*.scss` is compiled, concatenated, and written to `build/app.css`.
  - JS from `app/scripts/**/*.js` is passed through `gulp-remove-code`, concatenated, and written to `build/app.js`.
- Browser source files define classes in the global scope. They do not use ES modules.
- Test-only CommonJS exports are wrapped in:

```js
// removeIf(production)
module.exports = SomeClass;
// endRemoveIf(production)
```

- Keep this wrapper pattern when adding browser classes that also need direct test imports.

## Application Architecture

- `GameCoordinator` is the top-level orchestrator. It owns DOM references, maze setup, lifecycle state, input handling, score/lives/level state, timers, sound, collision event wiring, and level transitions.
- `GameEngine` owns the fixed-timestep animation loop. It updates entities with `update(elapsedMs)` and renders them with `draw(interp)`.
- Game entities are stored in `entityList`; entities participate in the loop by exposing `update` and/or `draw`.
- `Pacman` handles player movement, sprite state, wall collision decisions, warp tunnels, death animation, and the directional arrow.
- `Ghost` handles ghost movement, targeting, chase/scatter/scared/eyes modes, ghost-house behavior, speed changes, and Pac-Man collision events.
- `Pickup` represents pac-dots, power pellets, and fruit. It owns its DOM node, visibility, point value, proximity gating, collision checks, and dispatches point/power events.
- `CharacterUtil` contains shared grid, movement, velocity, snapping, warp, stutter, and spritesheet helper logic.
- `Timer` wraps `setTimeout` to support pause/resume and registers itself through `addTimer`/`removeTimer` window events.
- `SoundManager` owns sound effects, ambient loops, master volume, and optimized dot playback using Web Audio buffers.

## Event Flow

- The code uses browser `window` events as the main integration boundary between entities and coordinator logic.
- Important custom events include `awardPoints`, `deathSequence`, `dotEaten`, `powerUp`, `eatGhost`, `restoreGhost`, `addTimer`, `removeTimer`, `releaseGhost`, and `swipe`.
- Preserve event names and payload shapes unless all callers and tests are updated together.

## Maze And Coordinates

- The maze is declared in `GameCoordinator` as a 31-row array of strings, then split into a two-dimensional tile array.
- Tile values have established meaning:
  - `X`: wall.
  - `o`: pac-dot.
  - `O`: power pellet.
  - space: walkable path.
- `tileSize` is `8`; `determineScale` picks the largest integer scale that fits the viewport.
- Character positions are CSS pixel positions, while movement decisions use grid coordinates derived by `CharacterUtil.determineGridPosition`.
- Characters are sized as 2x2 tiles and positions use half-tile offsets. Be careful with exact equality checks around snapped grid positions.

## UI And Assets

- `index.html` contains the DOM structure expected by the JavaScript. Many classes assume specific element IDs exist.
- Graphics use SVG/PNG sprite assets under `app/style/graphics/spriteSheets`.
- Audio uses MP3 files under `app/style/audio`.
- Asset paths are hardcoded in several classes; changing folders or filenames requires updating preload lists, spritesheet selection, tests, and possibly HTML.
- Material Icons and the Press Start 2P font are loaded from Google-hosted stylesheets.

## Testing Strategy

- Tests live in `app/tests` and use Mocha, Node `assert`, Sinon, and hand-built browser globals.
- The test suite stubs DOM, audio, image, timers, and game collaborators directly rather than using a browser runner.
- `npm test` enforces 100% statements, functions, branches, and lines for `app/scripts/**/*.js`.
- The post-test step parses `coverage/index.html` and rewrites `coverage/coverage-summary.json`; that JSON file is intentionally tracked.
- Existing Husky hooks run `npm run lint` on pre-commit and `npm test` on pre-push.
- Prefer focused tests that validate actual behavior. Avoid broad mocks unless matching the current test style for browser APIs.

## Style And Conventions

- Match the existing plain JavaScript class style and CommonJS test style.
- Keep imports/requires at the top in Node-side files and tests.
- Browser source files should remain compatible with concatenation into one global script.
- Existing code uses JSDoc comments for many public methods. Add comments only when they clarify non-obvious game behavior or browser constraints.
- ESLint extends `airbnb-base` with project-specific rule overrides in `.eslintrc.js`; follow those settings instead of introducing a new formatter.
- Keep code changes small and localized. This codebase has tight coupling through global classes, DOM IDs, asset paths, and custom events.

## Common Change Guidance

- For gameplay changes, inspect `GameCoordinator`, the affected entity class, and related tests before editing.
- For movement or collision changes, inspect `CharacterUtil`, `Pacman`, `Ghost`, and the maze coordinate assumptions together.
- For sound changes, inspect both `SoundManager` and the preload list in `GameCoordinator`.
- For asset changes, update preload sources, path-building code, tests that assert exact URLs, and source assets under `app/style`.
- For UI changes, update `index.html`, SCSS sources, and any JavaScript DOM ID references together.
- After source changes, run the narrow relevant command first when possible, then `npm run lint` and `npm test` for behavior-affecting JavaScript.
