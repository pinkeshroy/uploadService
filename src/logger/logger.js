const create = require('./factory')

/**
 * Logger interface 
 */
module.exports.create = (transports) => {
    return create(transports)    
}