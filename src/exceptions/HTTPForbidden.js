/**
* HTTPForbidden Exception
* 
* @author Vikas Sood <vikas@thenthbit.com>
* @returns {Object}
* @name HTTPForbidden
* @alias HTTPForbidden Exception
* @param {Null}
* 
*/
const HTTPError = require('./HTTPError')

class HTTPForbidden extends HTTPError {
    constructor(message = 'Forbidden') {
        super(403, message)
    }
}

module.exports = HTTPForbidden
