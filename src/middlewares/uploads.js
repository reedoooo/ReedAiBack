const multer = require('multer');
const path = require('path');
const logger = require('../config/logging');
const fs = require('fs').promises;
const coerceFileSave = async (req, file, cb) => {
  try {
    if (!file.originalname) {
      cb(new Error('File name is missing'));
      return;
    }
    logger.info('File:', file);
    const ext = path.extname(file.originalname).toLowerCase();
    let type = '';

    // Determine file type
    if (ext === '.json') {
      type = 'application/json';
    } else if (ext === '.txt') {
      type = 'text/plain';
    } else if (ext === '.js') {
      type = 'application/javascript';
    } else if (ext === '.jsx') {
      type = 'text/jsx';
    } else if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
      type = `image/${ext.slice(1)}`;
    } else {
      cb(new Error('Unsupported file type'));
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(type)) {
      cb(new Error('File type not allowed'));
      return;
    }

    // Ensure correct extension
    const newFilename = file?.filename?.replace(/\.[^/.]+$/, '') + '.' + type.split('/')[1];
    logger.info(`New filename: ${newFilename}`);
    logger.info(`New file type: ${type}`);
    logger.info(`File path: ${file.path}`);
    logger.info(`File mimetype: ${file.mimetype}`);
    logger.info(`File originalname: ${file.originalname}`);
    logger.info(`File size: ${file.size}`);
    logger.info(`File encoding: ${file.encoding}`);
    logger.info(`File fieldname: ${file.fieldname}`);
    // const newPath = path.join(path.dirname(file.path), newFilename);
    // logger.info('New file path:', newPath);
    // await fs.rename(file.path, newPath);

    // Update file object with new details
    file.path = console.log('New file path:', file?.path);
    file.filename = newFilename;
    file.mimetype = type;

    cb(null, true);
  } catch (error) {
    cb(error);
  }
};
const uploadPath = '../../public/static/uploads';
// path.join(__dirname, uploadPath);
const createStorage = () =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, uploadPath));
    },
    filename: (req, file, cb) => {
      // Generate a unique filename using timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });
const uploadStorage = createStorage();
const createMulterConfig = storage => {
  return multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: coerceFileSave,
  });
};
const upload = createMulterConfig(uploadStorage);
const handleSingleUpload = uploadFunction => {
  return async (req, res, next) => {
    uploadFunction.single('file')(req, res, async err => {
      if (err) {
        logger.info(`[${err}][${err.message}]`, JSON.stringify(err));
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      try {
        const coercedFile = await coerceFileSave(req.file);
        req.file.path = coercedFile.path;
        req.file.mimetype = coercedFile.type;
        next();
      } catch (error) {
        logger.error('Error coercing file save:', error.message);
        return res.status(400).json({ error: 'Error processing uploaded file.' });
      }
    });
  };
};
// const createMulterConfig = storage => {
//   return multer({
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
//     fileFilter: (req, file, cb) => {
//       // Allow only specific file types
//       const filetypes = /jpeg|jpg|png|gif|txt|pdf|doc|docx|json/;
//       const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//       const mimetype = filetypes.test(file.mimetype);
//       logger.info(`File type: ${file.mimetype}`);
//       logger.info(`File extension: ${path.extname(file.originalname)}`);
//       if (mimetype && extname) {
//         return cb(null, true);
//       } else {
//         cb('Error: Files of this type are not allowed!');
//       }
//     },
//   });
// };

// const upload = createMulterConfig(uploadStorage);

const handleArrayUpload = uploadFunction => {
  return (req, res, next) => {
    uploadFunction.array('files', 5)(req, res, err => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size limit exceeded (max: 6MB).' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files (max: 5).' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: 'An error occurred during file upload.' });
      }
      next();
    });
  };
};

const handleMultiTypeUpload = (req, res, next) => {
  const uploadMiddleware = upload.array('files', 5);

  uploadMiddleware(req, res, err => {
    if (err instanceof multer.MulterError) {
      logger.info('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size limit exceeded (max: 6MB).' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files (max: 5).' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'An error occurred during file upload.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    // Files uploaded successfully, now handle the message content
    const messageContent = req.body.message;
    const files = req.files;

    // Process the message and files as needed
    console.log('Message content:', messageContent);
    console.log(
      'Uploaded files:',
      files.map(file => file.filename)
    );

    next();
  });
};

module.exports = {
  handleSingleUpload: handleSingleUpload(upload),
  handleArrayUpload: handleArrayUpload(upload),
  handleMultiTypeUpload,
  uploadPath,
  // ALLOWED_FILE_TYPES,
  coerceFileSave,
  createStorage,
  uploadStorage,
  createMulterConfig,
  upload,
};
