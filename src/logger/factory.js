/**
 * Logger
 */

const winston = require("winston")
const WinstonSlackTransport = require('winston-slack-webhook-transport')
const WinstonRotate = require('winston-daily-rotate-file')
const { combine, timestamp, label, json, printf, prettyPrint } = winston.format


//Using the printf format.
const customFormat = printf(({ level, message, label, timestamp }) => {
    return `[${label} ${timestamp} ${level}] ${message}`
})

function createConsoleTransport(config, options) {
    return new (winston.transports.Console)(options)
}
  
function createFileRotateTransport(config, options) {
    if(config.filename)
        options.filename = config.filename
    if(config.dirname)
        options.dirname = config.dirname
    
    return new (WinstonRotate)(options)
}
  
function createSlackTransport(config, options) {
    return new (WinstonSlackTransport)(options)
}

// we pass this function an array of transport objects
// each transport object has 2 properties: type & options
function getLoggerTransports(transports) {
    return transports.map((transport) => {
        const {type, config} = transport

        /**
         * Initialize default options
         */
        let options = {}

        //using syslog levels
        options.levels = winston.config.syslog.levels

        let format = null
        if(config.format == 'json') {
            format = winston.format.json()
            options.format = combine(
                label({ label: config.service }),
                timestamp({
                    format: "MMM-DD-YYYY HH:mm:ss",
                }),
                format
            )
        }
        else {
            options.format = combine(
                winston.format.colorize(),
                label({ label: config.service }),
                timestamp({
                    format: "MMM-DD-YYYY HH:mm:ss",
                }),
                customFormat
            )
        }
        
        switch (type) {
            case 'console':
                return createConsoleTransport(config, options)
            case 'file-rotate':
                return createFileRotateTransport(config, options)
            case 'slack':
                return createSlackTransport(config, options)
        }
    })
}

// our export function which will be invoked by our singleton
module.exports = function create(transports) {
    return winston.createLogger({
        transports: getLoggerTransports(transports)
    })
}
