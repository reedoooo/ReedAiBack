const express = require('express');
const { asyncHandler } = require('../../utils/api/sync.js');
const authenticate = require('../../middlewares/authenticate.js');
const {
  getAllFiles,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
  downloadFile,
  uploadSingleFile,
  uploadMultipleFiles,
} = require('../../controllers/index.js');
const { upload } = require('../../middlewares/uploads.js');
const fs = require('fs');
const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllFiles));
router.get('/:id', asyncHandler(getFileById));
router.post('/', asyncHandler(createFile));
router.put('/:id', asyncHandler(updateFile));
router.delete('/:id', asyncHandler(deleteFile));

// Upload and download files routes
router.get('/download/:id', asyncHandler(downloadFile));
router.post('/upload/single', upload.single('file'), asyncHandler(uploadSingleFile));
router.post('/upload/array', upload.array('files'), asyncHandler(uploadMultipleFiles));

// Get list of all static files by file type
router.get(
  '/static/list/:filename',
  asyncHandler((req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../public/static/files', filename);

    fs.access(filePath, exists => {
      if (!exists) {
        return res.status(404).send('File not found');
      }
      res.sendFile(filePath);
    });
  })
);

// Get list of all static files
router.get(
	'/static/list',
	asyncHandler((req, res) => {
		const files = fs.readdirSync(path.join(__dirname, '../../public/static/files'));
		res.json({ files });
	})
);

module.exports = router;
