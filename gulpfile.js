const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const removeCode = require('gulp-remove-code');

function styles() {
  return gulp
    .src('app/style/scss/**/*.scss')
    .pipe(sass())
    .pipe(concat('app.css'))
    .pipe(gulp.dest('build'));
}

function scripts() {
  return gulp
    .src([
      'app/scripts/utilities/characterUtil.js',
      'app/scripts/utilities/firebaseLeaderboard.js',
      'app/scripts/utilities/leaderboard.js',
      'app/scripts/utilities/nexiTheme.js',
      'app/scripts/utilities/soundManager.js',
      'app/scripts/utilities/timer.js',
      'app/scripts/characters/ghost.js',
      'app/scripts/characters/pacman.js',
      'app/scripts/pickups/pickup.js',
      'app/scripts/core/gameCoordinator.js',
      'app/scripts/core/gameEngine.js',
      'app/scripts/nexi-mode.js',
    ])
    .pipe(removeCode({ production: true }))
    .pipe(concat('app.js'))
    .pipe(gulp.dest('build'));
}

function watch() {
  gulp.watch('app/style/**/*.scss', styles);
  gulp.watch('app/scripts/**/*.js', scripts);
}

const build = gulp.parallel(styles, scripts);

exports.watch = watch;
exports.default = build;
