const config = require("../config/sevice_config");
const { BlobServiceClient } = require("@azure/storage-blob");
const UploadAPIService = require('./upload');

class UploadAPIServiceFactory {
    static createUploadAPIService() {
        const azureStorageConnectionString = config.AZURE_STORAGE_CONNECTION_STRING;
        const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
        const containerName = config.AZURE_CONTAINER_NAME;
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        return new UploadAPIService(blobServiceClient, containerClient, containerName);
    }
}


module.exports = UploadAPIServiceFactory;