const config = require("../config/sevice_config");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
const streamifier = require('streamifier');
const multer = require('multer');
const gdal = require("gdal-async")
const fs = require('fs');
const stream = require('stream');
const sharp = require('sharp');
const path = require('path');



class UploadAPIService{
    constructor(blobServiceClient, containerClient, containerName) {
        this.blobServiceClient = blobServiceClient;
        this.containerClient = containerClient;
        this.containerName = containerName;
    }

    getUser = async (test) => {
        try {
            return {
                count: test,
                rows: [{}, {}]
            }
        } catch (error) {
            throw error
        }
    }

    convertToCog = async (buffer) => {
        const outputFilePath = 'src/temp/output_cog.tif';
    
        
        const dataset = gdal.open(buffer);
    
        
        gdal.translate(outputFilePath, dataset, [
            '-co', 'TILED=YES',
            '-co' ,'COPY_SRC_OVERVIEWS=YES',   
            '-co', 'COMPRESS=LZW'  
        ]);
    
        const readStream = fs.createReadStream(outputFilePath);
        const chunks = [];
        for await (const chunk of readStream) {
            chunks.push(chunk);
        }
        const cogBuffer = Buffer.concat(chunks);
        fs.unlinkSync(outputFilePath);
        dataset.close()
        return cogBuffer;
    };

    extractGeoreferencing = async(buffer) =>{
        const dataset = gdal.open(buffer);
        const geoTransform = dataset.geoTransform;
        const projection = dataset.srs.toWKT();
        dataset.close();
        return { geoTransform, projection };
    }

    removeBlackBackground = async (buffer) => {

        const image = sharp(buffer);


        const { width, height } = await image.metadata();

        const threshold = 0;
        let top = 0, bottom = height, left = 0, right = width;


        const topPixels = await sharp(buffer).extract({ left: 0, top: 0, width, height: 1 }).raw().toBuffer();
        if (topPixels.every(pixel => pixel == threshold)) {
            top++;
        }


        const bottomPixels = await sharp(buffer).extract({ left: 0, top: height-1, width,  height: 1 }).raw().toBuffer();
        if (bottomPixels.every(pixel => pixel == threshold)) {
            bottom--;
        }


        const leftPixels = await sharp(buffer).extract({ left: 0, top: 0, width: 1, height }).raw().toBuffer();
        if (leftPixels.every(pixel => pixel == threshold)) {
            left++;
        }


        const rightPixels = await sharp(buffer).extract({ left: width - 1, top: 0, width: 1, height }).raw().toBuffer();
        if (rightPixels.every(pixel => pixel == threshold)) {
            right--;
        }


        return sharp(buffer).extract({ left, top, width: right - left, height: bottom - top }).toBuffer();
    };

    reapplyGeoreferencing = async(filePath, geoTransform, projection) =>{
        const dataset = gdal.open(filePath, 'r+');
        dataset.geoTransform = geoTransform;
        dataset.srs = gdal.SpatialReference.fromWKT(projection);
        dataset.close();
    }

    splitAndProcessImage = async (buffer, blobName, folderPath) => {
        try {
            const image = sharp(buffer);
            const { width, height } = await image.metadata();
            const chunkSize = 640;
            const { geoTransform, projection } = await this.extractGeoreferencing(buffer);
            const chunks = [];
            var i = 0;
            for (let x = 0; x < width; x += chunkSize) {
                for (let y = 0; y < height; y += chunkSize) {
                    const chunkWidth = Math.min(chunkSize, width - x);
                const chunkHeight = Math.min(chunkSize, height - y);
                console.log(`Processing chunk at (${x}, ${y}) with dimensions ${chunkWidth}x${chunkHeight}`);

                if (x < 0 || y < 0 || x + chunkWidth > width || y + chunkHeight > height) {
                    console.error(`Invalid extraction area: (${x}, ${y}, ${chunkWidth}, ${chunkHeight})`);
                    continue;
                }
                    let chunk = await sharp(buffer).rotate().extract({
                        left: x,
                        top: y,
                        width: chunkWidth,
                        height: chunkHeight
                    }).toBuffer();

                   
                    chunk = await this.removeBlackBackground(chunk);
                    
                    
                    const processedChunk = await sharp(chunk)
                        .resize({
                            width: chunkSize,
                            height: chunkSize,
                            fit: 'contain',
                            background: { r: 255, g: 255, b: 255, alpha: 0 } 
                        })
                        .toBuffer();
                    
                    const chunkBlobName = `${path.parse(blobName).name}_chunk_${i}${path.extname(blobName)}`;
                    i++;
                    const chunkPath = path.join(folderPath, chunkBlobName);
                    fs.writeFileSync(chunkPath, chunk)
                    const newGeoTransform = await this.calculateGeoTransform(geoTransform, x, y, chunkWidth, chunkHeight);
                    this.reapplyGeoreferencing(chunkPath, newGeoTransform, projection)
                    chunks.push(processedChunk);
                }
            }

            return chunks;
        } catch (error) {
            console.error(`Error in splitAndProcessImage: ${error.message}`);
            throw error;
        }
    };


    uploadData = async (blobName, buffer) => {
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        
        
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        const blockSize = 4 * 1024 * 1024; 
        const uploadOptions = {
            blockSize,
            concurrency: 10, 
        };

        const uploadBlockBlobResponse = await blockBlobClient.uploadStream(bufferStream, blockSize, uploadOptions.concurrency, {
            onProgress: (ev) => console.log(`Uploaded ${parseInt(ev.loadedBytes)/1000000} MB of ${parseInt(buffer.length)/1000000}`),
        });

        return uploadBlockBlobResponse;
    }

    
    uploadImageChunks = async (blobName, chunks) => {
        
        const uploadPromises = chunks.map((chunk, index) => {
            const chunkBlobName = `${path.parse(blobName).name}_chunk_${index}${path.extname(blobName)}`;
            return this.uploadData(chunkBlobName, chunk, true);
        });

        await Promise.all(uploadPromises);
    };



    
    
   

    isMostlyBlack =  async(chunkBuffer) =>{
        const image = sharp(chunkBuffer);
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        
        let blackPixelCount = 0;
        const totalPixels = info.width * info.height;
        
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i+1], data[i+2]];
            if (r < 10 && g < 10 && b < 10) blackPixelCount++;
        }
        
        return (blackPixelCount / totalPixels) > 0.5;
    }


}



module.exports = UploadAPIService
