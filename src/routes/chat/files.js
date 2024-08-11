const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
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
const fs = require('fs');
const { upload } = require('@/middlewares/upload.js');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: API to manage files.
 */

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get all files
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: List of all files
 */

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get a file by ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File details
 */

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload a new file
 *     tags: [Files]
 *     responses:
 *       201:
 *         description: File uploaded
 */

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete a file by ID
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: File deleted
 */

/**
 * @swagger
 * /files/upload/single:
 *   post:
 *     summary: Upload a single file
 *     tags: [Files]
 *     responses:
 *       201:
 *         description: File uploaded
 */

/**
 * @swagger
 * /files/upload/array:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Files]
 *     responses:
 *       201:
 *         description: Files uploaded
 */

// Define routes and handlers here
router.use(authenticate);
router.get('/', asyncHandler(getAllFiles));
router.get('/:id', asyncHandler(getFileById));
router.post('/', asyncHandler(createFile));
router.put('/:id', asyncHandler(updateFile));
router.delete('/:id', asyncHandler(deleteFile));
router.get('/download/:id', asyncHandler(downloadFile));
router.post('/upload/single', upload.single('file'), asyncHandler(uploadSingleFile));
router.post('/upload/array', upload.array('files'), asyncHandler(uploadMultipleFiles));
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
