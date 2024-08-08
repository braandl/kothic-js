/*global module:false*/
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        jshint: {
            options: {
                strict: false,
                esnext: true,

                bitwise: false,
                curly: false,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                noempty: true,
                nonew: true,
                sub: true,
                undef: false,
                unused: true,

                globals: {
                    MapCSS: true,
                    L: true,
                    Kothic: true,
                    console: true,
                    rbush: true
                },

                trailing: true,
                indent: 4,

                browser: true
            },
            all: {
                src: ['Gruntfile.js', 'src/index.js']
            }
        },

        browserify: {
            dist: {
                src: 'src/index.js',
                dest: 'dist/kothic.bundled.js'
            },
            options: {
                browserifyOptions: { debug: true },
                transform: [["babelify", { "presets": ["@babel/preset-env"] }]],
            },
        },

        uglify: {
            options: {
                banner: '/*\n (c) 2011-2019, Darafei Praliaskouski, Vladimir Agafonkin, Maksim Gurtovenko, Stephan Brandt\n' +
                        ' Kothic JS is a full-featured JavaScript map rendering engine using HTML5 Canvas.\n' +
                        ' Built on <%= grunt.template.today("dd-mm-yyyy") %> |' +
                        ' https://github.com/kothic/kothic-js\n*/\n'
            },
            dist: {
                files: {
                    'dist/kothic.js': ['<%= browserify.dist.dest %>']
                }
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['jshint', 'browserify', 'uglify']);
};