const multer = require('multer');
const path = require('path');

const createStorage = absolutePath =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, absolutePath);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

const genAbsolutePath = relativePath => path.join(__dirname, relativePath);
const uploadPath = genAbsolutePath('../uploads');
const staticPath = genAbsolutePath('../static');
const generatedPath = genAbsolutePath('../generated');
const publicPath = genAbsolutePath('../public');

const uploadStorage = createStorage(uploadPath);
const staticStorage = createStorage(staticPath);
const generatedStorage = createStorage(generatedPath);
const publicStorage = createStorage(publicPath);

const createMulterConfig = storage => {
  return multer({
    storage,
    limits: { fileSize: 6000000 }, // 6MB limit
  });
};

const upload = createMulterConfig(uploadStorage);
const staticUpload = createMulterConfig(staticStorage);
const generatedUpload = createMulterConfig(generatedStorage);
const publicUpload = createMulterConfig(publicStorage);

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
    uploadFunction.array(req.fileType)(req, res, err => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
};

module.exports = {
  handleUpload: {
    file: handleSingleUpload(upload),
    staticFile: handleSingleUpload(staticUpload),
    generatedFile: handleSingleUpload(generatedUpload),
    publicFile: handleSingleUpload(publicUpload),
    image: handleSingleUpload(upload),
    staticImage: handleSingleUpload(staticUpload),
    generatedImage: handleSingleUpload(generatedUpload),
    publicImage: handleSingleUpload(publicUpload),
  },
  handleArrayUpload: {
    files: handleArrayUpload(upload),
    staticFiles: handleArrayUpload(staticUpload),
    generatedFiles: handleArrayUpload(generatedUpload),
    publicFiles: handleArrayUpload(publicUpload),
    images: handleArrayUpload(upload),
    staticImages: handleArrayUpload(staticUpload),
    generatedImages: handleArrayUpload(generatedUpload),
    publicImages: handleArrayUpload(publicUpload),
  },
};
