const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const { upload, handleUploadError } = require('@/middlewares/upload.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('@/config/logging');
const {
  getAllFiles,
  getAllFilesByType,
  getFileById,
  getFileByName,
  getChatFileById,
  getAssistantFileById,
  getMessageFileItemsByMessageId,
  createFile,
  createChatFile,
  createAssistantFile,
  createMessageFileItems,
  updateFile,
  deleteFile,
  downloadFile,
  uploadFile,
  uploadSingleFile,
  uploadMultipleFiles,
} = require('@/controllers/chat-sessions/attachments');
const { upsertDocs, queryComponents } = require('@/utils/ai/pinecone');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// File retrieval routes
router.get('/', asyncHandler(getAllFiles));
router.get('/type/:type', asyncHandler(getAllFilesByType));
router.get('/:id', asyncHandler(getFileById));
router.get('/name/:name', asyncHandler(getFileByName));
router.get('/chat/:id', asyncHandler(getChatFileById));
router.get('/assistant/:id', asyncHandler(getAssistantFileById));
router.get('/message/:id', asyncHandler(getMessageFileItemsByMessageId));

// File creation and update routes
router.post('/', asyncHandler(createFile));
router.post('/chat', asyncHandler(createChatFile));
router.post('/assistant', asyncHandler(createAssistantFile));
router.post('/message', asyncHandler(createMessageFileItems));
router.put('/:id', asyncHandler(updateFile));
router.delete('/:id', asyncHandler(deleteFile));

// File download and upload routes
router.get('/download/:id', asyncHandler(downloadFile));
router.post('/upload', upload.single('file'), handleUploadError, asyncHandler(uploadFile));
router.post('/upload/single', upload.single('file'), asyncHandler(uploadSingleFile));
router.post('/upload/array', upload.array('files'), asyncHandler(uploadMultipleFiles));

// Additional functionality routes
router.post('/upsert-docs', asyncHandler(upsertDocs));
router.post('/query-components', asyncHandler(queryComponents));

// Static file routes
router.get(
  '/static/:filename',
  asyncHandler((req, res) => {
    const { filename } = req.params;
    logger.info('filename', filename);
    const filePath = path.join(__dirname, '../../../public/static', filename);
    logger.info('filePath', filePath);
    fs.access(filePath, exists => {
      if (!exists) {
        return res.status(404).send('File not found');
      }
      res.sendFile(filePath);
    });
  })
);

router.get(
  '/static/list/:filetype',
  asyncHandler((req, res) => {
    try {
      const filePaths = [];
      const { filetype } = req.params;
      const files = fs.readdirSync(path.join(__dirname, '../../../public/static'));
      files.forEach(file => {
        if (file.endsWith(filetype)) {
          filePaths.push(file);
        }
      });
      res.json({ filePaths });
    } catch (error) {
      console.error('Error reading directory:', error);
      return res.status(500).send('Internal Server Error');
    }
  })
);

router.get(
  '/static/list',
  asyncHandler((req, res) => {
    const files = fs.readdirSync(path.join(__dirname, '../../../public/static'));
    res.json({ files });
  })
);

module.exports = router;
