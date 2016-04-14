/**
 * @fileOverview: cli
 * @author: xuejian.xu
 * @date: 16/4/12.
 */

var Ng = require('./ng');
var optimist = require('optimist');
var config = require('./config.json');

exports.run = function () {
    var args = optimist.argv;

    var arg0 = args._[0] || config.default;
    var arg1 = args._[1] || 'help';

    //支持的command
    var cmd = [
        'list',
        'add',
        'modify',
        'remove',
        'host',
        'addhost',
        'help'
    ];

    if(arg0 in config){
        if(~cmd.indexOf(arg1)){
            new Ng({
                args : args._,
                fpath : config[arg0]
            }).start(arg1);
        }
    }

    if(~cmd.indexOf(arg0)){
        new Ng({
            args : args._,
            fpath : config[config.default]
        }).start(arg0);
    }
};
