var read = require('./module/read.js');
var logger = require('./lib/logger.js');
var _ = require('lodash');
var prompt = require('prompt');
var confirm = require('./lib/confirm.js');
var write = require('./module/write.js');
var exec = require("child_process").exec;
var config = require('./config.json');
var path = require('path');
var fs = require('fs');

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
        rm: function(){
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
        md : function(){
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
            logger.info('默认: ' + config.default);

            _.forOwn(config, function(value, key){
                if(key == 'default') return;

                logger.info([key,value].join(' '));
            });
        },

        /**
         * 添加一条host配置文件
         */
        addhost : function(){
            _this = this;

            prompt.start();
            prompt.get([
                {
                    name : 'host',
                    message : '请输入改host全称(例: fuwu.qunar.com)',
                    warning : '全称不能为空!',
                    empty : false
                },
                {
                    name : 'alias',
                    message : '请输入该host简称(例: fuwu)',
                    warning : '别名不能为空!',
                    empty : false
                },
                {
                    name : 'path',
                    message : '请输入该host配置文件路径(例: /usr/local/etc/nginx/vhost/test.conf)',
                    warning : '路径不能为空!',
                    empty : false
                }
            ], function(err, values){
                if(err) return logger.errlog(err);

                config[values.alias] = values.path;

                var tpl = fs.readFileSync(path.join(__dirname,'tpl/base.conf'), 'utf8');

                try{
                    fs.access(values.path, function(err){
                        if(err){
                            fs.writeFile(values.path, tpl.replace('$host$', values.host),function(){
                                try{
                                    fs.writeFileSync(path.join(__dirname,'config.json'), JSON.stringify(config,null,4));
                                }catch(err){
                                    logger.errlog(err);
                                    logger.errlog('config.json文件更新失败!');
                                }

                                logger.info(values.alias + ' 添加成功! 当前host列表:');

                                _this.actions.host();

                                logger.info('正在重启nginx...');
                                exec('sudo nginx -s reload',function(){
                                    logger.info('nginx 重启成功!');
                                });
                            })
                        }
                    });
                }catch(err){
                    logger.errlog('请检查文件路径是否有效!');
                }
            })
        },

        /**
         * 删除一条host
         */
        rmhost : function(){
            var  hosts = [];

            logger.info('当前host列表:');
            _.forOwn(config, function(value, key){
                if(key == 'default') return;

                hosts.push(key);

                logger.info([key,value].join(' '));
            });

            prompt.start();
            prompt.get({
                name : 'del',
                message : '选择要删除的host,请输入简称',
                conform : function(value){
                    return ~hosts.indexOf(value);
                },
                warning : '该host不存在,请重新输入!'
            },function(err, values){
                if(err) return logger.errlog(err);

                var delUrl = config[values.del];

                //如果删除的是默认host,则将默认值置空
                if(values.del == config.default){
                    config.default = '';
                }
                delete config[values.del];

                fs.writeFile(path.join(__dirname,'config.json'), JSON.stringify(config,null,4), function(err){
                    if(err) return logger.errlog(err);

                    exec('rm -f ' + delUrl,function(){
                        logger.info(delUrl + ' 已删除!');
                    });

                    logger.info('当前host列表:');
                    _.forOwn(config, function(value, key){
                        if(key == 'default') return;

                        logger.info([key,value].join(' '));
                    });
                })
            });
        },

        /**
         * 选择默认host
         */
        df : function(){
            var  hosts = [];

            _.forOwn(config, function(value, key){
                if(key == 'default') return;

                hosts.push(key);
            });

            _.remove(hosts, function(el){
                return el == config.default;
            });

            logger.info(['当前默认host:', config.default].join(' '));
            logger.info('可选host: (' + hosts.join(', ') + ')');

            prompt.start();
            prompt.get({
                name : 'default',
                message : '选择默认host,请输入简称',
                conform : function(value){
                    return ~hosts.indexOf(value);
                },
                warning : '该host不存在,请重新输入!'
            },function(err, values){
                if(err) return logger.errlog(err);

                config.default = values.default;

                fs.writeFile(path.join(__dirname,'config.json'), JSON.stringify(config,null,4), function(err){
                    if(err) return logger.errlog(err);

                    logger.info('默认host修改成功! 当前host默认值:' + values.default);
                })
            });
        },

        help : function(){
            logger.info([
                '支持的命令:',
                'list    ----  列出所有规则',
                'add     ----  添加一条规则',
                'md      ----  修改一条规则',
                'rm      ----  删除一条规则',
                'host    ----  列出所有host',
                'addhost ----  添加一个host',
                'rmhost  ----  删除一条host',
                'df      ----  修改默认host',
                'help    ----  帮助'
            ].join('\n'));
        }
    }
};

module.exports = Ng;