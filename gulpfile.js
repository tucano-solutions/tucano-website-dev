// Gulp packages
const gulp        = require('gulp')
const log         = require('gulplog')
const pug         = require('gulp-pug')
const rev         = require('gulp-rev')
const watchify    = require('watchify')
const sass        = require('gulp-sass')
const babel       = require('gulp-babel')
const browserify  = require('browserify')
const rename      = require('gulp-rename')
const uglify      = require('gulp-uglify')
const buffer      = require('vinyl-buffer')
const postcss     = require('gulp-postcss')
const standard    = require('gulp-standard')
const sourcemaps  = require('gulp-sourcemaps')
const collect     = require('gulp-rev-collector')
const source      = require('vinyl-source-stream')
const browserSync = require('browser-sync').create()

// Node.js packages
const del = require('del')
const path = require('path')

// PostCSS packages
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const mqpacker = require('css-mqpacker')

// Common paths
const root = __dirname
const tmp = path.resolve(root, 'tmp')
const src = path.resolve(root, 'src')
const jsFiles = path.resolve(src, '**/*.js')
const scssFiles = path.resolve(src, '**/*.scss')
const viewFiles = path.resolve(src, '**/*.pug')
const revManifest = path.resolve(tmp, 'rev-manifest.json')

// Aliases
const reload = browserSync.reload
const isProduction = process.env.NODE_ENV === 'production'
const revOptions = {
  base: tmp,
  merge: true,
  path: revManifest
}

// =================== JS TASKS ==================
gulp.task('lint:js', _ => {
  return gulp.src(jsFiles)
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: isProduction,
      quiet: false
    }))
})

const browserifyOpts = {
  entries: path.resolve(src, 'index.js'),
  debug: !isProduction
}

gulp.task('build:js', _ => {
  var b = browserify(browserifyOpts)
  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(babel())
    .pipe(uglify())
    .on('error', log.error)
    .pipe(rev())
    .pipe(gulp.dest(tmp))
    .pipe(rev.manifest(revOptions))
    .pipe(gulp.dest(tmp))
})

gulp.task('dev:js', _ => {
  var b = watchify(browserify(browserifyOpts))
  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(babel())
      .on('error', log.error)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(tmp))
    .pipe(reload({stream: true}))
})

// ================= VIEWS TASKS =================
const buildViews = _ => {
  return gulp.src(viewFiles)
    .pipe(pug({
      baseDir: src,
      debug: false,
      compileDebug: false
    }))
    .pipe(gulp.dest(tmp))
}

gulp.task('build:views', buildViews)

gulp.task('dev:views', _ => {
  return buildViews()
    .pipe(reload({stream: true}))
})

// ================== CSS TASKS ==================
const basePlugins = [
  autoprefixer,
  mqpacker
]

gulp.task('build:css', _ => {
  const plugins = [...basePlugins, cssnano]
  return gulp.src(scssFiles)
    .pipe(sass())
    .pipe(postcss(plugins))
    .pipe(rename({dirname: ''}))
    .pipe(rev())
    .pipe(gulp.dest(tmp))
    .pipe(rev.manifest(revOptions))
    .pipe(gulp.dest(tmp))
})

gulp.task('dev:css', _ => {
  const plugins = [...basePlugins]
  return gulp.src(scssFiles)
    .pipe(sourcemaps.init())
      .pipe(sass()).on('error', sass.logError)
      .pipe(postcss(plugins))
      .pipe(rename({dirname: ''}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(tmp))
    .pipe(reload({stream: true}))
})

// ================= WATCH TASKS =================
gulp.task('watch:js', done => {
  gulp.watch(jsFiles, gulp.series('dev:js'))
  done()
})

gulp.task('watch:views', done => {
  gulp.watch(viewFiles, gulp.series('dev:views'))
  done()
})

gulp.task('watch:css', done => {
  gulp.watch(scssFiles, gulp.series('dev:css'))
  done()
})

gulp.task('watch', gulp.parallel(
  'watch:js',
  'watch:views',
  'watch:css'
))

// ================= CLEAN TASKS =================
gulp.task('clean:local', _ => del(tmp))

// ============== BROWSER SYNC TASKS =============
gulp.task('dev:browser-sync', done => {
  browserSync.init({
    server: {
      baseDir: tmp
    },
    open: false,
    reloadOnRestart: true
  })
  done()
})

// ============= FILE REVISION TASKS =============
gulp.task('revision', _ =>
   gulp.src([
     revManifest,
     path.resolve(tmp, '*.html')
   ])
     .pipe(collect())
     .pipe(gulp.dest(tmp))
)

// ========== PROJECT COMPILATION TASKS ==========
gulp.task('dev',
  gulp.series(
    'clean:local',
    'lint:js',
    gulp.parallel('dev:js', 'dev:views', 'dev:css'),
    gulp.parallel('watch', 'dev:browser-sync')
  )
)

gulp.task('build',
  gulp.series(
    'clean:local',
    'lint:js',
    gulp.parallel('build:js', 'build:views', 'build:css'),
    'revision'
  )
)

gulp.task('stage',
  gulp.series(
    'build',
    'dev:browser-sync'
  )
)
