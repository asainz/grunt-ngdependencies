# ngdependencies
Detects unused angular injected dependencies

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-ngdependencies --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-ngdependencies');
```

## ngdependencies task
_Run this task with the `grunt ngdependencies` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Example

```js

ngdependencies: {
    build: {
        files: [
            {
                expand: true,
                cwd: 'web/scripts/',
                src: [
                    '**/*.js',
                    '!config/**/*.js'
                ],
                dest: 'web/scripts/'
            }
        ]
    }
}
```