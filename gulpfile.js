const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const sync = require("browser-sync").create();
const del = require("del");
const imagemin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const rename = require("gulp-rename");
const webp = require("gulp-webp");
const csso = require("gulp-csso");
const minifyJS = require('gulp-minify');
const htmlmin = require('gulp-htmlmin');

const copyFiles = () => {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/*.ico"
  ], {
    base: "source"
  })
    .pipe(gulp.dest("build/"));
}
exports.copyFiles = copyFiles;

const copyHtml = () => {
  return gulp.src("source/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build/"));
}
exports.copyHtml = copyHtml;

const copyJS = () => {
  return gulp.src("source/js/*.js")
    .pipe(minifyJS())
    .pipe(gulp.dest("build/js"));
}
exports.copyJS = copyJS;

const makeWebp = () => {
  return gulp.src("build/img/**/*.{jpg,png}")
    .pipe(webp())
    .pipe(gulp.dest("build/img/"));
}
exports.makeWebp = makeWebp;

const makeSprite = () => {
  return gulp.src("build/img/**/*.svg")
    .pipe(svgstore())
    .pipe(rename("svg-sprite.svg"))
    .pipe(gulp.dest("build/img"));
}
exports.makeSprite = makeSprite;

const clean = () => {
  return del("build");
}
exports.clean = clean;

const minifyImages = () => {
  return gulp.src("source/img/*")
    .pipe(imagemin([
      imagemin.mozjpeg({progressive: true}),
      imagemin.optipng({optimizationLevel: 2}),
      imagemin.svgo({
        plugins: [
          {cleanupIDs: false}
        ]
      })
    ]))
    .pipe(gulp.dest("build/img"))
}
exports.minifyImages = minifyImages;

const minifyCss = () => {
  return gulp.src("build/css/style.css")
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}
exports.minifyCss = minifyCss;

// Styles

const styles = () => {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream());
}

exports.styles = styles;

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: "build"
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;

// Watcher

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series("styles", "minifyCss"));
  gulp.watch("source/*.html").on("change", sync.reload);
  gulp.watch("source/*.html").on("change", gulp.series("copyHtml"));
  gulp.watch("source/js/*.js").on("change", gulp.series("copyJS"));
  gulp.watch("source/js/*.js").on("change", sync.reload);
}

const build = gulp.series(clean, copyFiles, copyHtml, copyJS, styles, minifyCss, minifyImages, makeWebp, makeSprite);
exports.build = build;

exports.default = gulp.series(
  build, server, watcher
);
