const cluster = require('cluster')
const os = require('os')
const numCPUs = os.cpus().length
const log = require('./logger')
const logger = require('./logger')
const config = require('../src/config/sevice_config')
const UploadAPIService = require('./UploadAPIService')

if (cluster.isMaster) {
    logger.info(`Master process ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.error(`Worker process ${worker.process.pid} died. Restarting...`)
        cluster.fork()
    })
} else {
    logger.info(`Data upload started`);
    const authService = new UploadAPIService(config.SERVICE_NAME)
    authService.start()
}