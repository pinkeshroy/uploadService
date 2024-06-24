/**
 * The Base Controller: All other controllers extends from this controller
 */

class Controller {
    constructor() {

    }
    /**
     * This method returns a one time HTTP Response.
     *
     * @returns {null}
     * @name response
     * @param {Object} Res
     * @param {Object} Data
     * @param {Intger} Status
     *
     */
    response(res, data, status = 200) {
        if (status != 200) {
            data = {
                message: data.message,
            }
        }
        res.status(status).json(data)
        return res.end()
    }

    responseBinary(
        res,
        data,
        key,
        length,
        type = "application/octet-stream",
    ) {
        res.writeHead(200, {
            'Content-Type': type,
            'Content-disposition': 'attachmentfilename=' + key,
            'Content-Length': length
        })
        res.end(Buffer.from(data, 'binary'))
    }
}

module.exports = Controller
