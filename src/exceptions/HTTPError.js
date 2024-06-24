/**
* Base class for error handling
* 
* @author Vikas Sood <vikas@thenthbit.com>
* @returns {Object}
* @name HTTPError
* @alias HTTPError
* @param {} status
* @param {String} message
* 
*/
class HTTPError {
    constructor(status, message) {
        this.status = status
        this.message = message
    }
}

module.exports = HTTPError