const { debug } = require('console')
const dotenv = require('dotenv')
const path = require('path')

// dotenv.config({
//     path: path.resolve(__dirname, `${process.env.ENV}.env`),
// })

dotenv.config({
    path: path.resolve(__dirname, `dev.env`),
})

//export various environment varaibles from here
module.exports = {
    ENV: process.env.ENV || 'local',
    SERVICE_NAME: process.env.SERVICE_NAME || 'upload-api',
    SERVICE_BASE: process.env.SERVICE_BASE || '/api/v1/upload',
    SERVICE_VERSION: process.env.SERVICE_VERSION || '1.0.0',
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_CONTAINER_NAME: process.env.AZURE_CONTAINER_NAME
}