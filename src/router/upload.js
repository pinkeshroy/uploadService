const Express = require('express')
const multer = require('multer');
const Router = Express.Router()
const DataApiController = require("../controller/upload")
// Configure Multer for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

/* List all routes here*/


Router.get('/data', DataApiController.getUser);
Router.post('/stream', upload.single('file'), DataApiController.uploadData);

module.exports = Router

