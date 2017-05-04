var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var inject = require('gulp-inject');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');

var dest = 'assets/';

var pluginsJsFiles = [
    'vendors/leaflet/js/leaflet-search.min.js',
    'vendors/leaflet/js/Control.Opacity.js',
    'vendors/leaflet/js/leaflet.rrose-src.js',
    'vendors/leaflet-plugin/MarkerCluster/leaflet.markercluster-src.js',
    'vendors/leaflet-plugin/Sidebar/js/jquery-sidebar.min.js',
    'vendors/leaflet-plugin/Sidebar/js/leaflet-sidebar.js',
    'vendors/leaflet-plugin/ControlFullScreen/Leaflet.fullscreen.js',
    'vendors/leaflet-plugin/EasyButton/easy-button.js',
    'vendors/leaflet-plugin/OSMGeocoder/Control.OSMGeocoder.js',
    'vendors/leaflet/js/Leaflet-WFST.src.js'
];
var pluginsCssFiles = [
    'vendors/leaflet/css/*.css',
    'vendors/leaflet-plugin/**/*.css'
];
var angularFiles = [
    'vendors/angular/**/*.js'
];
var scriptsFiles = 'js/**/*.js';
var cssFiles = 'css/*.css';
var imageFiles = [
    'vendors/leaflet-plugin/ControlFullScreen/*.png'
];


gulp.task('plugins.js', function () {
    return gulp.src(pluginsJsFiles)
        .pipe(concat('plugins.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
});

gulp.task('plugins.css', function () {
    return gulp.src(pluginsCssFiles)
        .pipe(concat('plugins.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest(dest));
});

gulp.task('angular.dist.js', function () {
    return gulp.src(angularFiles)
        .pipe(concat('angular.dist.js'))
        .pipe(gulp.dest(dest));
});

gulp.task('scripts.js', function () {
    return gulp.src(scriptsFiles)
        .pipe(concat('scripts.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest));
});

gulp.task('styles.css', function () {
    return gulp.src(cssFiles)
        .pipe(concat('styles.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest(dest));
});

gulp.task('vendor-images', function () {
    return gulp.src(imageFiles)
        .pipe(gulp.dest(dest));
});

gulp.task('index.html', function () {
    return gulp.src('./index-src.html')
        .pipe(inject(gulp.src(['./assets/*.js'])))
        .pipe(inject(gulp.src(['./assets/*.css'])))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('.'));
});


gulp.task('default', ['angular.dist.js', 'plugins.js', 'scripts.js', 'styles.css', 'plugins.css', 'vendor-images', 'index.html']);
