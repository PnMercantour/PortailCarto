var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var inject = require('gulp-inject');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');
var CacheBuster = require('gulp-cachebust');
var cleanDest = require('gulp-clean-dest');
var cachebuster = new CacheBuster();


var buildDest = 'build';
var publishDest = 'assets';

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


/* BUILD OPTIMIZED RESOURCES */

gulp.task('plugins.js', function () {
    return gulp.src(pluginsJsFiles)
        .pipe(concat('plugins.js'))
        .pipe(uglify())
        .pipe(gulp.dest(buildDest));
});

gulp.task('plugins.css', function () {
    return gulp.src(pluginsCssFiles)
        .pipe(concat('plugins.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest(buildDest));
});

gulp.task('angular.dist.js', function () {
    return gulp.src(angularFiles)
        .pipe(concat('angular.dist.js'))
        .pipe(gulp.dest(buildDest));
});

gulp.task('scripts.js', function () {
    return gulp.src(scriptsFiles)
        .pipe(concat('scripts.js'))
        .pipe(uglify())
        .pipe(gulp.dest(buildDest));
});

gulp.task('styles.css', function () {
    return gulp.src(cssFiles)
        .pipe(concat('styles.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest(buildDest));
});

gulp.task('assets', function () {

});


gulp.task('build', ['angular.dist.js', 'plugins.js', 'scripts.js', 'styles.css', 'plugins.css']);


/* PUBLISH */


gulp.task('vendor-images', function () {
    return gulp.src(imageFiles)
        .pipe(cleanDest(publishDest, {extension: '.png'}))
        .pipe(gulp.dest(publishDest));
});

var jsStream = gulp.src([buildDest + '/*.js'])
    .pipe(cleanDest(publishDest, {extension: '.js'}))
    .pipe(cachebuster.resources())
    .pipe(gulp.dest(publishDest));

var cssStream = gulp.src([buildDest + '/*.css'])
    .pipe(cleanDest(publishDest, {extension: '.css'}))
    .pipe(cachebuster.resources())
    .pipe(gulp.dest(publishDest));

var injectJsTransform = function (filepath, file, i, length) {
    return '<script defer src="' + filepath + '"></script>';
};

gulp.task('index.html', function () {
    return gulp.src('./index-src.html')
        .pipe(inject(jsStream, {transform: injectJsTransform}))
        .pipe(inject(cssStream))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('.'))
});

gulp.task('publish', ['index.html', 'vendor-images']);
