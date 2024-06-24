/**
* HTTPNoContent
* 
* @author Vikas Sood <vikas@thenthbit.com>
* @returns {Object}
* @name HTTPNoContent
* @alias HTTPNoContent Exception
* @param {Null}
* 
*/
const HTTPError = require('./HTTPError')

class HTTPNoContent extends HTTPError {
    constructor(message='No Content') {
        super(204, message)
    }
}

module.exports = HTTPNoContent
