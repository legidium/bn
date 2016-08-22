var gulp        = require('gulp');
var prettify    = require('gulp-prettify');
var rename      = require("gulp-rename");
var cssconcat   = require('gulp-concat-css');
var jsconcat    = require('gulp-concat');
var replace     = require('gulp-replace');
var cleancss    = require('gulp-cleancss');
var uglify      = require('gulp-uglify');
 









// Concat css and move to merged
gulp.task('cssconcat', function(){
	
    return gulp.src('desktop.bundles/merged/_merged.css')
		      	.pipe(rename('css/merged.css'))
		      	// .pipe(cleancss({keepBreaks: false}))
    			.pipe(gulp.dest('merged/'));

});



// Concat css and move to merged
gulp.task('csscompress', function(){
	
    return gulp.src('desktop.bundles/merged/_merged.css')
		      	.pipe(rename('css/merged.min.css'))
		      	.pipe(cleancss({keepBreaks: false}))
    			.pipe(gulp.dest('merged/'));

});




// Concat js and move to merged
gulp.task('jsconcat', function(){

    return gulp.src(['desktop.bundles/merged/_merged.js'])
		        .pipe(jsconcat('js/merged.js'))
		        .pipe(gulp.dest('merged/'));

});


gulp.task('jscompress', function() {
  return gulp.src('merged/js/merged.js')
    .pipe(uglify())
    .pipe(rename({
	    suffix: ".min",
	}))
    .pipe(gulp.dest('merged/js/'));
});




gulp.task('prettify', function() {

	var time = new Date().getTime();

	return gulp.src('desktop.bundles/**/*.html')


		.pipe(replace(/<link rel="stylesheet" href="_(.*?)\.css"/g, '<link rel="stylesheet" href="css/merged.min.css?' + time + '"'))
		.pipe(replace(/<script src="_(.*?)\.js"><\/script>/g, '<script src="js/merged.min.js?' + time + '"></script>'))

		.pipe(prettify({indent_size: 2}))


		.pipe(rename(function (path) {
		    path.dirname = '';
		}))
		
		.pipe(gulp.dest('merged/'));
				
});














gulp.task('default', ['cssconcat', 'csscompress', 'jsconcat', 'jscompress', 'prettify']);











