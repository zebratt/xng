/**
 * @fileOverview: #
 * @author: xuejian.xu
 * @date: 16/4/14.
 */
    var fs = require('fs');
var tpl = fs.readFileSync('./tpl/base.conf', 'utf8');

console.log( tpl);