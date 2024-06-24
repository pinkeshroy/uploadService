const ImagePreProcessing = require('./dataprepservice');


class DataProcServiceFactory{
    static createDataProcessService() {
        return new ImagePreProcessing();
    }
}

module.exports = DataProcServiceFactory