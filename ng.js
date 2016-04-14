var read = require('./module/read.js');
var logger = require('./lib/logger.js');
var _ = require('lodash');
var prompt = require('prompt');
var confirm = require('./lib/confirm.js');
var write = require('./module/write.js');
var exec = require("child_process").exec;
var config = require('./config.json');
var path = require('path');

function Ng(option){
    this.args = option.args;
    this.fpath = option.fpath;
}

Ng.prototype = {
    construstor : Ng,

    start : function(cmd){
        this.actions[cmd].call(this);
    },

    actions : {
        /**
         * 列出所有匹配规则
         */
        list: function(){
            read(this.fpath, function(results){
                _.map(results, function(el, idx){
                    logger.info([idx, el.url, ':', el.addr].join(' '));
                });
            })
        },

        /**
         * 删除一条规则
         */
        remove: function(){
            var _this = this;

            prompt.start();
            prompt.get([
                {
                    name : 'index',
                    validator : /^\d{1,2}$/,
                    empty : false,
                    warning : '下标格式有误!'
                }
            ], function(err, values){
                if(err) return logger.errlog(err);

                read(_this.fpath, function(results){
                    var el = results[values.index];

                    confirm(['确认删除:',el.url,'吗?'].join(' '),function(){
                        results.splice(values.index, 1);

                        write(_this.fpath, results, function(){
                            logger.info(el.url + '删除成功! nginx 正在重启...');

                            exec('sudo nginx -s reload',function(){
                                logger.info('nginx 重启成功!');
                            });
                        });
                    });
                })
            });
        },

        /**
         * 添加一条规则
         */
        add : function(){
            var _this = this;

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
            }], function (err, values) {
                if(err) return logger.errlog(err);

                var url = values.url,
                    addr = values.address;

                read(_this.fpath, function(results){
                    results.push({
                        url : url,
                        addr : addr
                    });

                    write(_this.fpath, results, function(){
                        logger.info([url,'添加成功! nginx 正在重启...'].join(' '));

                        exec('sudo nginx -s reload',function(){
                            logger.info('nginx 重启成功!');
                        });
                    })
                });
            });
        },

        /**
         * 修改一条规则
         */
        modify : function(){
            var _this = this;

            prompt.start();
            prompt.get([{
                name : 'index',
                validator : /^\d{1,2}$/,
                warning: '数字格式有误!',
                empty : false
            }],function(err, values){
                if(err) return logger.errlog(err);

                var idx = values.index;

                read(_this.fpath, function(results){
                    var item = results[idx];

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
                        ],function(err, values){
                            results[idx].url = values.url;
                            results[idx].addr = values.address;

                            write(_this.fpath, results,function(){
                                logger.info([values.url, '修改成功! nginx 正在重启...'].join(' '));

                                exec('sudo nginx -s reload',function(){
                                    logger.info('nginx 重启成功!');
                                });
                            })
                        })
                    }else{
                        logger.errlog('下标超出范围!');
                    }
                });
            });
        },

        /**
         * 列出所有host配置文件
         */
        host : function(){
            _.forOwn(config, function(value, key){
                if(key == 'default') return;

                logger.info([key,value].join(' '));
            });
        },

        /**
         * 添加一条host配置文件
         */
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
            ], function(err, values){
                config[values.alias] = values.path;

                fs.writeFile(path.join(__dirname,'config.json'), JSON.stringify(config,null,4), function(err){
                    if(err) return logger.errlog(err);

                    logger.info(result.alias + ' 添加成功!');
                })
            })
        },

        help : function(){
            logger.info([
                '支持的命令:',
                'list    ----  列出所有规则',
                'add     ----  添加一条规则',
                'modify  ----  修改一条规则',
                'remove  ----  删除一条规则',
                'host    ----  列出所有host配置',
                'addhost ----  添加一条host配置',
                'help    ----  显示帮助'
            ].join('\n'));
        }
    }
};

module.exports = Ng;

