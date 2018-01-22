// Gulp packages
const gulp        = require('gulp')
const log         = require('gulplog')
const pug         = require('gulp-pug')
const rev         = require('gulp-rev')
const watchify    = require('watchify')
const sass        = require('gulp-sass')
const babel       = require('gulp-babel')
const browserify  = require('browserify')
const concat      = require('gulp-concat')
const inject      = require('gulp-inject')
const rename      = require('gulp-rename')
const uglify      = require('gulp-uglify')
const buffer      = require('vinyl-buffer')
const postcss     = require('gulp-postcss')
const standard    = require('gulp-standard')
const sourcemaps  = require('gulp-sourcemaps')
const source      = require('vinyl-source-stream')
const browserSync = require('browser-sync').create()

// Node.js packages
const del = require('del')
const path = require('path')
const exec = require('child_process').exec
const prompt = require('prompt')

// PostCSS packages
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const mqpacker = require('css-mqpacker')

// Common paths
const tmp = path.resolve(__dirname, 'tmp')
const src = path.resolve(__dirname, 'src')
const jsFiles = path.resolve(src, '**/*.js')
const scssFiles = path.resolve(src, '**/*.scss')
const viewFiles = path.resolve(src, 'index.pug')
const publishFolder = path.resolve(__dirname, '../tucano-solutions.github.io')

// Aliases
const reload = browserSync.reload
const isProduction = process.env.NODE_ENV === 'production'

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
    .pipe(concat('styles.css'))
    .pipe(rev())
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
  gulp.watch(viewFiles, gulp.series('dev:views', 'inject'))
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

gulp.task('clean:publish', _ => del([
  path.resolve(publishFolder, '*.*'),
  `!${path.resolve(publishFolder, 'README.md')}`
], {force: true}))

// ================== COPY TASKS =================
gulp.task('copy:publish', _ =>
  gulp.src(path.resolve(tmp, '*.*'))
    .pipe(gulp.dest(publishFolder))
)

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

// ============= FILE INJECTION TASKS ============

gulp.task('inject', _ => {
  const sources = gulp.src([
    path.resolve(tmp, '*.js'),
    path.resolve(tmp, '*.css')
  ], {read: false})
  return gulp.src(path.resolve(tmp, 'index.html'))
    .pipe(inject(sources, {relative: true}))
    .pipe(gulp.dest(tmp))
})

// ================== GIT TASKS ==================
const execCb = (error, stdout, stderr) => {
  error !== null && log.error(error) && process.exit(1)
  stdout && console.log(stdout)
  stderr && log.error(stderr)
}
gulp.task('git:pull', _ =>
  exec('git pull', {cwd: publishFolder}, execCb)
)

gulp.task('git:commit', _ => {
  const schema = {
    properties: {
      commitMessage: {
        description: 'Enter a commit message',
        required: true
      }
    }
  }
  return new Promise((resolve, reject) => {
    prompt.start()
    prompt.get(schema, (err, { commitMessage }) => {
      exec(`git add -A && git commit -am "${commitMessage}"`, {cwd: publishFolder},
        (error, stdout, stderr) => {
          execCb(error, stdout, stderr)
          resolve()
        }
      )
    })
  })
})

gulp.task('git:push', _ =>
  exec('git push', {cwd: publishFolder}, execCb)
)

// ========== PROJECT COMPILATION TASKS ==========
gulp.task('dev',
  gulp.series(
    'clean:local',
    'lint:js',
    gulp.parallel('dev:js', 'dev:views', 'dev:css'),
    gulp.parallel('watch', 'dev:browser-sync'),
    'inject'
  )
)

gulp.task('build',
  gulp.series(
    'clean:local',
    'lint:js',
    gulp.parallel('build:js', 'build:views', 'build:css'),
    'inject'
  )
)

gulp.task('stage',
  gulp.series(
    'build',
    'dev:browser-sync'
  )
)

gulp.task('publish',
  gulp.series(
    'build',
    'git:pull',
    'clean:publish',
    'copy:publish',
    'git:commit',
    'git:push'
  )
)
