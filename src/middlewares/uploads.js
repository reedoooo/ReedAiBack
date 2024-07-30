const multer = require('multer');
const path = require('path');

const uploadPath = '../../public/static/uploads';

const createStorage = () =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, uploadPath));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

const uploadStorage = createStorage();

const createMulterConfig = storage => {
  return multer({
    storage,
    limits: { fileSize: 6000000 }, // 6MB limit
    fileFilter: (req, file, cb) => {
      // Add file type validation if needed
      cb(null, true);
    },
  });
};

const upload = createMulterConfig(uploadStorage);

const handleSingleUpload = uploadFunction => {
  return (req, res, next) => {
    uploadFunction.single(req.fileType)(req, res, err => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

const handleArrayUpload = uploadFunction => {
  return (req, res, next) => {
    uploadFunction.array(req.fileType, 5)(req, res, err => {
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
};
