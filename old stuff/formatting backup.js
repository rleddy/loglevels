//  formatting.js
//
const os = require('os')

// code for use in formatting messages used throughout and especially logging

const DEFAULT_ERROR_SEP = ";;;  "


// oneLineErrorCallStack
//
// Sometimes there is a requirement to put the call stack on a single line.
// This method splits the multiline call stack and rejoins it into a single string with the user chosen separator or the default separator.

module.exports.oneLineErrorCallStack = (eObj,separator) => {
    if ( typeof eObj === 'object' ) {
        if ( eObj.constructor !== undefined ) {
            if ( eObj.constructor.name === 'TypeError' ) {
                var b = eObj.stack.split('\n').map(line => line.trim())
                if ( separator === undefined ) {
                    separator = DEFAULT_ERROR_SEP
                }
                return b.join(separator)
            }
        }
    } 
    return(false)
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
        this.fieldSet = Object.keys(this.fieldValues)
        //
        setValue('host',os.hostname())
    }

    // process id
    setProcessId() {
        this.fieldValues['pid'] = ''
        this.fieldSet = Object.keys(this.fieldValues)
        //
        setValue('pid',process.pid)
    }

    // for sockets see net module or http/https
    // set the port as a colon separated pair remotePort:localPort
    setSocketPort(socket) {
        if ( (typeof socket === 'object') && (socket.remotePort !== undefined) ) {
            //
            this.fieldValues['port'] = ''
            this.fieldSet = Object.keys(this.fieldValues)
            //
            setValue('port','' + socket.remotePort + ':' + socket.localPort)
        }
    }

    // set the port as a colon separated pair remotePort:localPort
    setSocketAddress(socket) {
        if ( (typeof socket === 'object') && (socket.remoteAddress !== undefined) ) {
            //
            this.fieldValues['ip-address'] = ''
            this.fieldSet = Object.keys(this.fieldValues)
            //
            setValue('ip-address','' + socket.remoteAddress + ':' + socket.localAddress)
        }
    }




    // outputLine
    //
    // assuming values have been formatted as they are set, then just append a string and return it.
    outputLine() {
        var output = ''
        var sep = ''

        for ( var fky in this.fieldValues ) {
            var appstr = this.fieldValues[fky]
            output += sep + appstr
            sep = this.separator
        }

        return output

    }


}



module.exports.FieldLineFormatter = FieldLineFormatter;