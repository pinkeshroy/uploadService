/**
 * Initialize and get the instance of our logger
 */
const transports = require('./transports')
const Logger = require('./logger')

module.exports = Logger.create(transports)
