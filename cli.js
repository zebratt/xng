/**
 * @fileOverview: cli
 * @author: xuejian.xu
 * @date: 16/4/12.
 */

var ng = require('./ng');
var optimist = require('optimist');
var config = require('./config.json');

exports.run = function () {
    var args = optimist.argv;

    /**
     * 支持的command:
     *     list
     *     add
     *     modify
     *     remove
     *     help
     */
    var arg0 = args._[0] || 'fuwu';
    var arg1 = args._[1] || 'list';

    if(arg0 in config){
        if(arg1 in ng){
            ng[arg1](args._, config[arg0]);
        }
    }

    if(arg0 in ng){
        ng[arg0](args._, config.fuwu);
    }
};
