var fs = require('fs');
var _ = require('lodash');
var logger = require('./logger');
var exec = require("child_process").exec;
var prompt = require('prompt');
var config = require('./config.json');
var path = require('path');

var Ng = {
    list : function(args, path){
        read(path, function(resultList){
            _.map(resultList, function(el, idx){
                logger.info([idx, el.url, ':', el.addr].join(' '));
            });
        });
    },

    remove : function(args, path){
        if(!path) return;

        var idx = args[2];

        read(path, function(resultList){
            if(resultList.length === 0){
                return;
            }

            if(idx === undefined){
                idx = resultList.length - 1;
            }

            try{
                var el = resultList[idx];

                resultList.splice(idx,1);  //remove

                logger.info([el.url,':',el.addr,'removed! Now restart nginx...'].join(' '));

                write(path, resultList, function(){
                    exec('sudo nginx -s reload',function(){
                        logger.info('nginx restarted!');
                    });
                })
            }catch(e){
                logger.errlog('[Param] index error!');
            }
        });
    },

    add : function(args, path){
        if(!path) return;

        prompt.start();
        prompt.get([{
            name : 'url',
            message : 'url',
            warning: 'url不得为空!',
            empty: false
        }, {
            name: 'address',
            validator: /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)(:\d{2,4})?$/,
            warning: 'ip地址不合法!',
            empty: false
        }], function (err, result) {
            if (err){
                logger.errlog(err);
                return;
            }

            var url = result.url,
                addr = result.address;

            read(path, function(resultList){
                resultList.push({
                    url : url,
                    addr : addr
                });

                write(path, resultList,function(){
                    logger.info([url,':',addr,'added! Now restart nginx...'].join(' '));

                    exec('sudo nginx -s reload',function(){
                        logger.info('nginx restarted!');
                    });
                })
            });
        });
    },

    modify : function(args, path){
        prompt.start();
        prompt.get([{
            name : 'index',
            validator : /^\d{1,2}$/,
            warning: '数字格式有误!',
            empty : false
        }],function(err, result){
            if (err){
                logger.errlog(err);
                return;
            }

            var index = result.index;

            read(path, function(resultList){
                var item = resultList[index];

                if(item){
                    prompt.start();
                    prompt.get([{
                        name : 'url',
                        default : item.url,
                        warning: 'url不得为空!',
                        empty: false
                    },{
                        name: 'address',
                        default: item.addr,
                        validator: /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)(:\d{2,4})?$/,
                        warning: 'ip地址不合法!',
                        empty: false
                    }
                    ],function(err, result){
                        resultList[index].url = result.url;
                        resultList[index].addr = result.address;

                        write(path, resultList,function(){
                            logger.info([result.url,':',result.address,'modified! Now restart nginx...'].join(' '));

                            exec('sudo nginx -s reload',function(){
                                logger.info('nginx restarted!');
                            });
                        })
                    })
                }else{
                    logger.errlog('[index] out of range!');
                }
            });
        });
    },

    host : function(){
        _.forOwn(config, function(value, key){
            logger.info([key,value].join(' '));
        });
    },

    addhost : function(){
        prompt.start();
        prompt.get([
            {
                name : 'alias',
                warning : '别名不能为空!',
                empty : false
            },
            {
                name : 'path',
                warning : '路径不能为空!',
                empty : false
            }
        ], function(err, result){
            config[result.alias] = result.path;

            fs.writeFile(path.join(__dirname,'config.json'), JSON.stringify(config,null,4), function(err){
                if(err) return;

                logger.info(result.alias + ' 添加成功!');
            })
        })
    },

    help : function(){
        logger.info('A simple tool for nginx ~');
    }
};

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

module.exports = Ng;