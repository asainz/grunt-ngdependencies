'use strict';

var esprima = require('esprima');
var escodegen = require('escodegen');
var astral = require('astral')();
var traverse = require('traverse');
var _ = require('underscore');
var chalk = require('chalk');

var utils = {
    isSameArray: function(r1, r2){
        var sameArray = true;

        //If both arrays have different length, then they are not the same
        //so fail fast.
        if(r1.length !== r2.length) return false;

        r1.sort();
        r2.sort();

        _.each(r1, function(value, index){
            if( value !== r2[index] ){
                sameArray = false;
            }
        });

        return sameArray;
    }
};

module.exports = function (grunt) {

    function isMainFunctionParamNode(fnParamsRanges, nodeRange){
        var isParamNode = false;

        _.each(fnParamsRanges, function(paramRange){
            if( !isParamNode ){
                isParamNode = utils.isSameArray(nodeRange, paramRange);
            }
        });

        return isParamNode;
    }

    function getUnusedDependencies(inputCode){
        var ast = esprima.parse(inputCode, {
            tolerant: true,
            comment: true,
            range: true,
            tokens: false
        });

        var isFirstFunctionExpression = true;
        var fn;
        var fnParams;
        var fnParamsRanges;

        traverse(ast).forEach(function (node) {
            if( node && typeof node === 'object' && node.type ){
                if( node.type === 'FunctionExpression' && isFirstFunctionExpression ){
                    fn = node;
                    isFirstFunctionExpression = false;
                }
            }
        });

        if( !fn ){
            return [];
        }

        fnParams = _.map(fn.params, function(param){
            return param.name;
        });

        // each param has a range array. It's created out of the position in the file and it's unique. We will use it to check if an identifier
        // is being used in the code or it's just the definition in the main function.
        fnParamsRanges = _.map(fn.params, function(param){
            return param.range;
        });

        var usedDependencies = [];
        var unusedDependencies = [];

        traverse(ast).forEach(function (node) {
            if( node && typeof node === 'object' && node.type ){
                // targets: myMethod($window) -> $window will be set as used
                if( node.type === 'Identifier' && !isMainFunctionParamNode(fnParamsRanges, node.range) ){
                    if( usedDependencies.indexOf(node.name) === -1 ){
                        usedDependencies.push(node.name);
                    }
                }

                // targets: $resource() -> $resource will be set as used
                if( node.type === 'CallExpression' && node.callee.type === 'Identifier' ){
                    var identifierName = node.callee.name;
                    if( usedDependencies.indexOf(identifierName) === -1 ){
                        usedDependencies.push(identifierName);
                    }
                }

                // targets: myModule.something -> myModule will be set as used
                if( node.type === 'CallExpression' && node.callee.type === 'MemberExpression' ){
                    var calleeName = node.callee.object.name;
                    if( usedDependencies.indexOf(calleeName) === -1 ){
                        usedDependencies.push(calleeName);
                    }
                }

                // targets: name = myModule.name -> myModule will be set as used
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
        var results = [];
        var totalUnusedDependencies = 0;
        var totalFilesWithUnusedDependencies = 0;

        this.files.forEach(function (file) {
            var fileContent = file.src.map(grunt.file.read).join('');

            var unusedDependencies = getUnusedDependencies(fileContent);

            if( unusedDependencies.length > 0 ){
                results.push({
                    dependencies: unusedDependencies,
                    file: file.src
                });
                totalUnusedDependencies += unusedDependencies.length;
                totalFilesWithUnusedDependencies += 1;
            }
        });

        _.each(results, function(result){
            grunt.log.writeln( chalk.magenta('Processing: ') + result.file );
            grunt.log.writeln( chalk.magenta('You have to remove: ') + result.dependencies );
            grunt.log.writeln('\n');
        });

        if( results.length > 0 ){
            var finalResult = 'You have ' + totalUnusedDependencies + ' unused dependencies in ' + totalFilesWithUnusedDependencies + ' files. \n';
            grunt.log.writeln( chalk.red(finalResult) );

            return false;
        }

    });
};


