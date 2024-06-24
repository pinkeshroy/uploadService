
const Service = require('./Service')
const config = require('./config/sevice_config')
const cors = require('cors')

//add upload data routes
const uploadRoutes = require('./router/upload')

class UploadApiService extends Service {
    constructor(name) {
        super(name)

        this.App.use(cors({
            origin: '*'
        }))

        this.initRoutes()
    }

    initRoutes() {
        /* Load the middleware */
        this.App.use(config.SERVICE_BASE, uploadRoutes)
    }

    start() {
        //start express service here
        super.start()
        //
    }
}

module.exports = UploadApiService
