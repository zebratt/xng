/**
 * @fileOverview: write
 * @author: xuejian.xu
 * @date: 16/4/14.
 */

var fs = require('fs');
var _ = require('lodash');

function write(path, resultList, callback){
    fs.readFile(path, function(err, data){
        var fileStr = data.toString('utf8');
        var tpl = '\nlocation url {\n    proxy_pass $scheme://address$request_uri;\n    proxy_set_header   Host $host;\n    proxy_set_header   X-Real-IP        $remote_addr;\n    proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;\n}\n';

        var str = '#rule';
        _.map(resultList, function(el){
            str += tpl.replace('url', el.url).replace('address', el.addr);
        });
        str += '#rule';

        var result = fileStr.replace(/#rule[\s\S]*#rule/, str);

        fs.writeFile(path,result,callback);
    })
}

module.exports = write;