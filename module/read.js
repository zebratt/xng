/**
 * @fileOverview: read
 * @author: xuejian.xu
 * @date: 16/4/14.
 */
var fs = require('fs');
var _ = require('lodash');

function read(path ,callback){
    fs.readFile(path ,function(err, data){
        var fileStr = data.toString('utf8');
        var ruleStr = _.trim(fileStr.split('#rule')[1]);
        var reLocation = /location/g;

        var matchArr = [];
        while(reLocation.exec(ruleStr) != null){
            matchArr.push(reLocation.lastIndex - 8);  //the length of 'location' is 8
        }

        var locationList = [];
        _.map(matchArr, function(el,idx){
            if(idx < matchArr.length - 1){
                locationList.push(ruleStr.slice(el, matchArr[idx+1]));
            }else{
                locationList.push(ruleStr.slice(el));
            }
        });

        var resultList = [];
        _.map(locationList, function(el){
            resultList.push(parse(el));
        });

        callback(resultList);
    });
}

function parse(rule){
    var lines = rule.split('\n'),
        regUrl = /location/,
        regAddr = /\$scheme:\/\//,
        urlResult = '',
        addrResult = '';

    _.map(lines, function(el){
        var res = regUrl.exec(el);

        if(res){
            urlResult = el.slice(res.index + 8, el.indexOf('{'));
        }

        res = regAddr.exec(el);
        if(res){
            addrResult = el.slice(res.index + 10, el.indexOf('$request_uri'));
        }
    });

    return {
        url : _.trim(urlResult),
        addr : _.trim(addrResult)
    }
}

module.exports = read;