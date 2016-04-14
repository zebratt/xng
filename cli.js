/**
 * @fileOverview: cli
 * @author: xuejian.xu
 * @date: 16/4/12.
 */

var Ng = require('./ng');
var optimist = require('optimist');
var config = require('./config.json');
var logger = require('./lib/logger.js');

exports.run = function () {
    var args = optimist.argv;

    var arg0 = args._[0] || config.default;
    var arg1 = args._[1] || 'help';

    if(!config.default && arg0 != 'dfhost'){
        return logger.errlog('默认host为空,前先执行 ng dfhost 设置默认host!');
    }

    //支持的command
    var cmd = [
        'list',
        'add',
        'md',
        'rm',
        'host',
        'addhost',
        'rmhost',
        'dfhost',
        'help'
    ];

    if(arg0 in config){
        if(arg1 == 'help'){
            arg1 = 'list';
        }

        if(~cmd.indexOf(arg1)){
            if(arg1 == 'help'){
                arg1 = 'list';
            }

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
