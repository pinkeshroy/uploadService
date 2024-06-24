const gdal = require("gdal-async")
const fs = require('fs');

const sharp = require('sharp');
const path = require('path');


class ImagePreProcessing {
    constructor() { }

    calculateGeoTransform  = async(geoTransform, x, y, chunkWidth, chunkHeight) =>{
        const newGeoTransform = [...geoTransform];
        newGeoTransform[0] = geoTransform[0] + x * geoTransform[1] + y * geoTransform[2];
        newGeoTransform[3] = geoTransform[3] + x * geoTransform[4] + y * geoTransform[5];
        return newGeoTransform;
    }

    convertToCog = async (buffer) => {
        const outputFilePath = 'src/temp/output_cog.tif';
        

        const dataset = gdal.open(buffer);


        gdal.translate(outputFilePath, dataset, [
            '-co', 'TILED=YES',
            '-co', 'COPY_SRC_OVERVIEWS=YES',
            '-co', 'COMPRESS=LZW'
        ]);

        const readStream = await fs.createReadStream(outputFilePath);
        const chunks = [];
        for await (const chunk of readStream) {
            chunks.push(chunk);
        }
        const cogBuffer = await Buffer.concat(chunks);
        
        dataset.close()
        return cogBuffer;
    };

    extractGeoreferencing = async (buffer) => {
        const dataset = gdal.open(buffer);
        const geoTransform = dataset.geoTransform;
        const projection = dataset.srs.toWKT();
        dataset.close();
        return { geoTransform, projection };
    }




    isMostlyBlack =  async(chunkBuffer) =>{
        const image = sharp(chunkBuffer);
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        
        let blackPixelCount = 0;
        const totalPixels = info.width * info.height;
        
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i+1], data[i+2]];
            if (r == 0 && g == 0 && b == 0) blackPixelCount++;
        }
        
        return (blackPixelCount / totalPixels) > 0.5;
    }
    

    reapplyGeoreferencing = async (filePath, geoTransform, projection) => {
        const dataset = gdal.open(filePath, 'r+');
        dataset.geoTransform = geoTransform;
        dataset.srs = gdal.SpatialReference.fromWKT(projection);
        dataset.close();
    }

    splitAndProcessImage = async (buffer, blobName, folderPath, chunkSize, isTiff = false) => {
        try {
            let width, height, geoTransform, projection;
    
            if (isTiff) {
                ({geoTransform, projection} = await this.extractGeoreferencing(buffer));
            }
    
            const image = sharp(buffer, { limitInputPixels: false });
            const metadata = await image.metadata();
            width = metadata.width;
            height = metadata.height;
    
            const chunkPromises = [];
            let i = 0;
    
            for (let x = 0; x < width; x += chunkSize) {
                for (let y = 0; y < height; y += chunkSize) {
                    const chunkWidth = Math.min(chunkSize, width - x);
                    const chunkHeight = Math.min(chunkSize, height - y);
    
                    
                    if (x < 0 || y < 0 || x + chunkWidth > width || y + chunkHeight > height) {
                        console.error(`Invalid extraction area: (${x}, ${y}, ${chunkWidth}, ${chunkHeight})`);
                        continue;
                    }
    
                    // Create a promise for processing each chunk
                    const chunkPromise = (async () => {
                        try {
                            let chunk = await sharp(buffer, { limitInputPixels: false }).extract({
                                left: x,
                                top: y,
                                width: chunkWidth,
                                height: chunkHeight
                            }).toBuffer();
    
                            const processedChunk = await sharp(chunk, { limitInputPixels: false })
                                .resize({
                                    width: chunkSize,
                                    height: chunkSize,
                                    fit: 'contain',
                                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                                })
                                .toBuffer();
    
                            if (await this.isMostlyBlack(processedChunk)) {
                                console.log(`Chunk at (${x}, ${y}) is mostly black, skipping...`);
                                return null;
                            }
    
                            const chunkBlobName = `${path.parse(blobName).name}_chunk_${i}${path.extname(blobName)}`;
                            i++;
                            const chunkPath = path.join(folderPath, chunkBlobName);
                            fs.writeFileSync(chunkPath, chunk);
    
                            if (isTiff) {
                                const newGeoTransform = await this.calculateGeoTransform(geoTransform, x, y, chunkWidth, chunkHeight);
                                this.reapplyGeoreferencing(chunkPath, newGeoTransform, projection);
                                chunk = await fs.readFileSync(chunkPath);
                            }
    
                            return chunk;
                        } catch (error) {
                            console.error(`Error processing chunk at (${x}, ${y}): ${error.message}`);
                            return null;
                        }
                    })();
    
                    chunkPromises.push(chunkPromise);
                }
            }
    
            
            const chunks = await Promise.all(chunkPromises);
    
            // Filter out any null values from skipped chunks
            return chunks.filter(chunk => chunk !== null);
        } catch (error) {
            console.error(`Error in splitAndProcessImage: ${error.message}`);
            throw error;
        }
    };
    


}

module.exports = ImagePreProcessing;