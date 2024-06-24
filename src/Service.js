const Express = require('express')
const BodyParser = require('body-parser')
const logger = require('./logger')
const fileUpload = require('express-fileupload')

class Service {
    constructor(name) {
        /* Service Name */
        this.name = name
        this.App = Express()
        // express fileUpload
        this.App.use(fileUpload())
        /* Load In Some Middleware */
        this.App.use(BodyParser.json())
    }

    /**
     * This method starts listening for incoming requests
     *
     * @name start
     *
     */
    start() {
        try {
            /* LIFTOFF!!!! */
            this.App.listen(3000, '0.0.0.0', () => {
                logger.info(`Listening on default port`)
            })
        } catch (err) {
            throw new Error(`[${this.name}] Failed to start Service ${err}`)
        }
    }
}

module.exports = Service
