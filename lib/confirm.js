/**
 * @fileOverview: confirm
 * @author: xuejian.xu
 * @date: 16/4/14.
 */

var prompt = require('prompt');

module.exports = function(message, callback){
    prompt.start();

    prompt.get({
        name: 'yesno',
        message: message,
        validator: /y[es]*|n[o]?/,
        warning: '输入必须为: yes or no',
        default: 'yes'
    }, callback);
};