//  formatting.js
//
const os = require('os')
const util = require('util')

const winston = require('winston')
const { combine, timestamp, label, json } = winston.format;


// code for use in formatting messages used throughout and especially logging
var gLoggerFileBasename = "local.log"
module.exports.setLoggerFile = (filename) => {
    gLoggerFileBasename = filename
}
 

var gConfigLogLevel = "notice"
module.exports.setConfigLogLevel = (level) => {
    gConfigLogLevel = level
}
 

const G_cloud_levels = {
    "emergency" : 0, 
    "alert" : 1,
    "critical" : 2,
    "error" : 3,
    "warning" : 4,
    "notice" : 5,
    "info" : 6,
    "debug" : 7,
    "default" : 8,
    "silly" : 9
}

var winstonInstance = null

function _initialize_winston_logger() {
    if ( winstonInstance === null ) {
        winstonInstance = winston.createLogger({
            level: gConfigLogLevel,
            levels: G_cloud_levels, 
            format: combine(timestamp(),json()),
            transports: [
              new winston.transports.Console(),
              new winston.transports.File({ 'filename' : gLoggerFileBasename })
            ]
          });
    }    
}



// A very simple line format class. This expects as format string with a %s to place the value of a field, and allows for key names to replace %k in the same format string optionally
// 
class FieldLineFormatter {
    //
    // fieldFormat : a format string,
    // fieldSet : an array of field names,
    // sep : a string to go inbetween formatted fields,
    // printKey : boolean => true means the key (name of value) will be printed
    constructor(fieldFormat,fieldSet,sep,printKey) {
        //
        this.fieldFormat = fieldFormat   // a string containing a variable allows substitution of stings.
        this.fieldSet = fieldSet
        //
        this.separator = (sep === undefined) ? '' : sep

        if ( this.separator === "\n" ) {
            throw "FieldLineFormatter: field separator must not be a newline"
        }

        if ( typeof fieldSet !== "object"  || fieldSet.length === undefined || fieldSet.length === 0 ) {
            throw "FieldLineFormatter: fieldSet must be an array of strings corresponding to field keys"
        }

        if ( printKey !== undefined && printKey ) {
            this.printKey = true;
        }

        this.fieldValues = {}
        this.rawValues = {}
        this.fieldSet.forEach(key => { this.fieldValues[key] = fieldFormat.replace('%s','').replace('%k','') })

        this.stackErrLog = false
    }

    clone() {
        var clone = new FieldLineFormatter(this.fieldFormat,this.fieldSet,this.separator,this.printKey)
        for ( var key in this.fieldValues ) {
            clone.setValue(key,this.rawValues[key])
        }
        return clone
    }

    // setValue
    // Set the value by storing its print representation. Don't store the actual value
    setValue(key,value) {
        if ( key in this.fieldValues ) {
            //
            this.rawValues[key] = value
            var vs = '' + value
            var vprint = this.fieldFormat.replace('%s',vs)
            if ( this.printKey ) {
                vprint = vprint.replace('%k',key)
            }
            this.fieldValues[key] = vprint;
        }
    }

    //
    unsetValue(key) {
        if ( key in this.fieldValues ) {
            this.setValue(key,'')
        }
    }

    //
    unsetValues(keys) {
        if ( typeof fieldSet !== "object"  || fieldSet.length === undefined || fieldSet.length === 0 ) {
            keys.forEach(key => { this.unsetValue(key); })
        }       
    }

    //
    // set special values
    // // // 

    // os host
    setHost() {
        //
        this.fieldValues['host'] = ''
        this.fieldSet = Object.keys(this.fieldValues)  // keep the fieldset up to date if this was not previously included
        //
        this.setValue('host',os.hostname())
    }

    // process id
    setProcessId() {
        this.fieldValues['pid'] = ''
        this.fieldSet = Object.keys(this.fieldValues)  // keep the fieldset up to date if this was not previously included
        //
        this.setValue('pid',process.pid)
    }

    // for sockets see net module or http/https
    // set the port as a colon separated pair remotePort:localPort
    setSocketPort(socket) {
        if ( (typeof socket === 'object') && (socket.remotePort !== undefined) ) {
            //
            this.fieldValues['port'] = ''
            this.fieldSet = Object.keys(this.fieldValues)  // keep the fieldset up to date if this was not previously included
            //
            this.setValue('port','' + socket.remotePort + ':' + socket.localPort)
        }
    }

    // set the port as a colon separated pair remotePort:localPort
    setSocketAddress(socket) {
        if ( (typeof socket === 'object') && (socket.remoteAddress !== undefined) ) {
            //
            this.fieldValues['ip-address'] = ''
            this.fieldSet = Object.keys(this.fieldValues)  // keep the fieldset up to date if this was not previously included
            //
            this.setValue('ip-address','' + socket.remoteAddress + ':' + socket.localAddress)
        }
    }

    setError(eObj,args) {
        if ( typeof eObj === 'object' ) {
            if ( eObj.constructor !== undefined ) {
                if ( eObj.constructor.name === 'Error' ) {
                    this.stackErrLog = true
                    this.fieldValues['err-stack'] = this.rawValues['err-stack'] = eObj.stack;
                    this.fieldSet = Object.keys(this.fieldValues)  // keep the fieldset up to date if this was not previously included
                    if ( args !== undefined ) {
                        return this._format(eObj.message,args);
                    } else {
                        return eObj.message
                    }
                }
            }
        } 
        return(false)
    }

    clearFields(erasers) {
        if ( typeof erasers === 'object' && erasers.length ) {
            erasers.forEach(fieldName => {
                this.fieldValues[fieldName] = ''
                this.rawValues[fieldName] = ''
            })
        }
    }


    clearErrStack() {
        if ( this.stackErrLog ) {
            this.clearFields(['err-stack'])
            this.stackErrLog = false
        }
    }

    deleteFields(deleters) {
        if ( typeof erasers === 'object' && erasers.length ) {
            erasers.forEach(fieldName => {
                delete this.fieldValues[fieldName]
                delete this.rawValues[fieldName]
            })
        }
    }

    _format(control,args) {
        var fargs = [control].concat(args)
        return util.format.apply(this,fargs)
    }

    format_error_message(msg,args) {
        var message = this.setError(msg,args);
        if ( message === false ) {
            message = this._format(msg,args);
        }
        return message
    }

}



module.exports.FieldLineFormatter = FieldLineFormatter;



class LogWrapper extends FieldLineFormatter {

    constructor(fieldSet) {
        super('%s',fieldSet,'',false)
        if ( winstonInstance === null ) {
            _initialize_winston_logger()
        }
        this.globalLogger = winstonInstance;
    }

    clone() {
        var clone = new LogWrapper(this.fieldSet)
        for ( var key in this.fieldValues ) {
            clone.setValue(key,this.rawValues[key])
        }
        return clone
    }

    emergency(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.emergency(message,this.fieldValues)
        this.clearErrStack()
    }

    alert(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.alert(message,this.fieldValues)
        this.clearErrStack()
    }

    critical(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.critical(message,this.fieldValues)
        this.clearErrStack()
    }

    error(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.error(message,this.fieldValues)
        this.clearErrStack()
    }

    warning(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.warning(message,this.fieldValues)
        this.clearErrStack()
    }

    notice(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.notice(message,this.fieldValues)
        this.clearErrStack()
    }

    info(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.info(message,this.fieldValues)
        this.clearErrStack()
    }

    debug(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.debug(message,this.fieldValues)
        this.clearErrStack()
    }

    default(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.default(message,this.fieldValues)
        this.clearErrStack()
    }

    silly(msg,...args) {
        var message = this.format_error_message(msg,args)
        this.globalLogger.silly(message,this.fieldValues)
        this.clearErrStack()
    }

}



module.exports.LogWrapper = LogWrapper;

module.exports.installGlobalLogger = (varName,fieldSet) => {
    if ( !(varName in global) ) {
        var myLogger = new LogWrapper(fieldSet)
        global[varName] = myLogger;    
    }
}
