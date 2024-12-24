const multer = require('multer');

const storage = multer.memoryStorage();

const multipleUpload = multer({ storage }).array('files'); // 'files' is the field name

// Create multer middleware for handling single file uploads
const singleUpload = multer({ storage }).single('file'); // 'file' is the field name

module.exports = {multipleUpload, singleUpload};
