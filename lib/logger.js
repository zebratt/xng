/**
 * @fileOverview: logger
 * @author: xuejian.xu
 * @date: 16/4/12.
 */

var COLOR_START_RED = '\033[31m',
    COLOR_START_GREEN = '\033[32m',
    COLOR_START_YELLOW = '\033[33m',
    COLOR_START_BLUE = '\033[34m',
    COLOR_START_GRAY = '\033[90m',
    COLOR_END = '\033[39m';

var Logger = {
    errlog : function(msg){
        console.log(COLOR_START_RED + msg + COLOR_END);

        return -1;
    },
    debug : function(msg){
        console.log(COLOR_START_YELLOW + msg + COLOR_END);
    },
    fileErr : function(msg){
        this.errlog('[FILE ERROR] ' + msg + COLOR_END);
    },
    serverErr : function(msg){
        this.errlog('[SERVER ERROR]' + msg + COLOR_END);
    },
    jsonErr : function(msg){
        this.errlog('[JSON ERROR] ' + msg + COLOR_END);
    },
    info : function(msg){
        if(typeof msg == 'object'){
            console.log(COLOR_START_GREEN + JSON.stringify(msg,null,4) + COLOR_END)
        }else{
            console.log(COLOR_START_GREEN + '[INFO] ' + msg + COLOR_END);
        }
    }
};

module.exports = Logger;