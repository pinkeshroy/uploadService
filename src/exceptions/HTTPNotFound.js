/**
* HTTPNotFound Exception
* 
* @author Vikas Sood <vikas@thenthbit.com>
* @returns {Object}
* @name HTTPNotFound
* @alias HTTPNotFound Exception
* @param {Null}
* 
*/
const HTTPError = require('./HTTPError')

class HTTPNotFound extends HTTPError {
    constructor(message='Not Found') {
        super(404, message)
    }
}

module.exports = HTTPNotFound
