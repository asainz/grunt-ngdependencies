'use strict';

var esprima = require('esprima');
var escodegen = require('escodegen');
var astral = require('astral')();
var traverse = require('traverse');

module.exports = function (grunt) {

    function getUnusedDependencies(inputCode){
        var ast = esprima.parse(inputCode, {
            tolerant: true,
            comment: true,
            range: true,
            tokens: true
        });

        var isFirstFunctionExpression = true;
        var fn;
        var fnParams;

        traverse(ast).forEach(function (node) {
            if( node && typeof node === 'object' && node.type ){
                if( node.type === 'FunctionExpression' && isFirstFunctionExpression ){
                    fn = node;
                    isFirstFunctionExpression = false;
                }
            }
        });


        fnParams = _.map(fn.params, function(param){
            return param.name;
        });

        var usedDependencies = [];
        var unusedDependencies = [];

        traverse(ast).forEach(function (node) {
            if( node && typeof node === 'object' && node.type ){

                if( node.type === 'CallExpression' && node.callee.type === 'MemberExpression' ){
                    var calleeName = node.callee.object.name;
                    if( usedDependencies.indexOf(calleeName) === -1 ){
                        usedDependencies.push(calleeName);
                    }
                }

                if( node.type === 'MemberExpression' ){
                    var memberName = node.object.name;
                    if( usedDependencies.indexOf(memberName) === -1 ){
                        usedDependencies.push(memberName);
                    }
                }
            }
        });

        fnParams.sort();
        usedDependencies.sort();

        _.each(fnParams, function(param){
            if( usedDependencies.indexOf(param) === -1 ){
                unusedDependencies.push(param);
            }
        });

        return unusedDependencies;
  }


    grunt.registerMultiTask('ngdependencies', 'Check app for unused dependencies', function () {

        grunt.log.writeln('ngdependencies processing ' + grunt.log.wordlist(this.files.map(function (file) {
            return file.src;
        })));

        var results = [];

        this.files.forEach(function (file) {
            var fileContent = file.src.map(grunt.file.read).join('');

            var unusedDependencies = getUnusedDependencies(fileContent);

            if( unusedDependencies.length > 0 ){
                results.push({
                    dependencies: unusedDependencies,
                    file: file.src
                });
            }
        });

        _.each(results, function(result){
            grunt.log.writeln( result.file );
            grunt.log.writeln( result.dependencies );
        });

        if( results.length > 0 ){
            grunt.log.writeln('Please remove the dependencies mentioned above.'['red']);
            return false;
        }

    });
};


