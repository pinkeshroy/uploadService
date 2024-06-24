const UploadService = require('../service/upload')
const Controller = require('./Controller')
const logger = require('../logger')
const streamifier = require('streamifier');
const path = require('path');
const fs = require('fs');
// const uploadService = new UploadService()
const UploadAPIServiceFactory = require('../service/UploadAPIServiceFactory');
const uploadService = UploadAPIServiceFactory.createUploadAPIService();
const ImagePreProcServiceFactory = require('../service/DataPreprocessServiceFactory');
const imageService = ImagePreProcServiceFactory.createDataProcessService();

class DataApiController extends Controller {
    constructor(service) {
        super(service)
    }

    getUser = async (req, res) => {
        logger.info(`Received ${req.method} ${req.url}`)

        try {
            const {test} = req.body;
            const data = await service.getUser(test)
            super.response(res, data)
        }
        catch (err) {
            super.response(res, err, err.status)
        }
    }


    uploadData = async (req, res) => {
        try {
            console.log(`Process ID: ${process.pid}`);
            const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
            let result;
            
            const uploadPromises = files.map(async (file) => {
                const blobName = file.name;
                const folderName = 'imagechips';


                const folderPath = path.join(__dirname, folderName);

                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath);
                    console.log(`Folder "${folderPath}" created successfully.`);
                } else {
                    console.log(`Folder "${folderPath}" already exists. now deleting`);

                    fs.rmSync(folderPath, { recursive: true, force: true });
                    fs.mkdirSync(folderPath);
                    console.log(`Folder "${folderPath}" created successfully.`);
                }

                const buffer = file.data;
                const chunkSize = 640;
                
                if(blobName.toLowerCase().endsWith('.tif')){
                    const startTime = performance.now();

                    const cogBuffer = await imageService.convertToCog(buffer);
                    
                    const chunks = await imageService.splitAndProcessImage(cogBuffer, blobName, folderPath, chunkSize, true);
                    const endTime = performance.now();
                    const timeTaken = (endTime-startTime)/1000
                    console.log('Preprocess taken time', timeTaken);
                    const startUploadTime = performance.now();
                    result = await uploadService.uploadImageChunks(blobName, chunks);
                    const endUploadTime = performance.now();
                    const timeTakenU = (endUploadTime - startUploadTime)/1000
                    console.log('upload taken time', timeTakenU);
                }
                else{

                   const chunks = await imageService.splitAndProcessImage(buffer, blobName, folderPath, chunkSize, false);
                   result = await uploadService.uploadImageChunks(blobName, chunks);
                }
            });
    
            
            await Promise.all(uploadPromises);
    
            super.response(res, result);
        } catch (err) {
            super.response(res, err, err.status)
        }
    };
    
}
module.exports = new DataApiController(uploadService)