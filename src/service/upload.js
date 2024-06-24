
const stream = require('stream');

const path = require('path');


class UploadAPIService {
    constructor(blobServiceClient, containerClient, containerName) {
        this.blobServiceClient = blobServiceClient;
        this.containerClient = containerClient;
        this.containerName = containerName;
        console.log('Upload Service Initiated');
    }

    getUser = async (test) => {
        try {
            return {
                count: test,
                rows: [{}, {}]
            };
        } catch (error) {
            throw error;
        }
    }

    uploadData = async (blobName, buffer) => {
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        const blockSize = 4 * 1024 * 1024;
        const uploadOptions = {
            blockSize,
            concurrency: 5,
        };

        const uploadPromise = () => new Promise(async (resolve, reject) => {
            let isUploaded = false;
            const timer = setTimeout(() => {
                if (!isUploaded) {
                    reject(new Error('Upload timed out'));
                }
            }, 10000);
            try{
            const result = await blockBlobClient.uploadStream(bufferStream, blockSize, uploadOptions.concurrency, {
                onProgress: (ev) => {
                    console.log(`Uploaded ${parseInt(ev.loadedBytes) / 1000000} MB of ${parseInt(buffer.length) / 1000000} file name ${blobName}`);
                    clearTimeout(timer);
                    isUploaded = true;
                },
            });
            clearTimeout(timer);
            resolve(result);
            return result
        }
        catch (err) {
            clearTimeout(timer);
            reject(err);
        }
            
        });

        try {
            return await uploadPromise();
        } catch (error) {
            console.log(`Retrying upload for ${blobName}`);
            return await uploadPromise();
        }
    }

    uploadImageChunks = async (blobName, chunks) => {
        if (Array.isArray(chunks)) {
            const uploadPromises = chunks.map((chunk, index) => {
                const chunkBlobName = `${blobName.split('.')[0]}/${path.parse(blobName).name}_chunk_${index}${path.extname(blobName)}`;
                return this.uploadData(chunkBlobName, chunk);
            });

            return await Promise.all(uploadPromises);
        } else {
            const result = await this.uploadData(blobName, chunks);
            return result;
        }
    };
}

module.exports = UploadAPIService;
