module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            js: {
                src: [
                    'js/jquery.min.js',
                    'js/angular/angular.min.js',
                    'js/angular/revizone.js',
                    'js/angular/revizone.controllers.js',
                    'js/angular/revizone.constants.js',
                    'js/angular/revizone.services.js',
                    'js/angular/angular-file-upload.min.js',
                    'js/angular/angular-route.min.js',
                    'js/angular/angular-socialshare.min.js',
                    'js/angular/ng-file-upload.min.js',
                    'js/angular/ngDialog.min.js',
                    'js/angular/ocLazyLoad.min.js',
                    'js/bootstrap/bootstrap-notify.min.js',
                    'js/bootstrap/bootstrap-tagsinput.min.js',
                    'js/bootstrap/bootstrap.min.js',
                    'js/momentjs/moment.js',
                    'js/quill/quill.min.js',
                    'js/quill/katex.min.js'
                ],
                dest: 'build/js/scripts.js',
            },
            css: {
                src: [
                    'css/fonts/imports.css', //must be the first imported file
                    'css/bootstrap/bootstrap.flat.css',
                    'css/angular/ngDialog-theme-default.min.css',
                    'css/angular/ngDialog.min.css',
                    'css/animate/animate.css',
                    'css/bootstrap/bootstrap-tagsinput.css',
                    'css/quill/quillsnow.css',
                    'css/quill/katex.min.css',
                    'css/styles.css'
                ],
                dest: 'build/css/styles.css'
            }
        },
        watch: {
            js: {
                files: ['js/**/*.js'],
                tasks: ['concat:js', 'ngAnnotate', 'uglify:js']
            },
            css: {
                files: ['css/**/*.css'],
                tasks: ['concat:css', 'cssmin:css']
            }
        },
        uglify: {
            js: {
                files: {
                    'build/js/scripts.js': ['build/js/scripts.js']
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1,

            },
            css: {
                files: {
                    'build/css/styles.css': ['build/css/styles.css']
                }
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: {
                    'build/js/scripts.js': ['build/js/scripts.js']
                }
            }
        }
    });

    grunt.registerTask('all', ['concat:js', 'ngAnnotate', 'uglify:js', 'concat:css', 'cssmin:css']);
    grunt.registerTask('js', ['concat:js', 'ngAnnotate', 'uglify:js']);
    grunt.registerTask('css', ['concat:css', 'cssmin:css']);

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-ng-annotate');

}
