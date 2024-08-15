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
  createChatFile,
  createAssistantFile,
  getMessageFileItemsByMessageId,
  createMessageFileItems,
  getChatFileById,
  getAssistantFileById,
  getAllFilesByType,
  getFileByName,
  uploadFile,
} = require('@/controllers');
  const fs = require('fs');
const path = require('path');
const { upload } = require('@/middlewares/upload.js');
const { upsertDocs } = require('@/utils/ai/pinecone/customUpsert.js');
const { queryComponents } = require('@/utils/ai/pinecone/query.js');
const router = express.Router();

router.use(authenticate);
//
router.get('/', asyncHandler(getAllFiles));
router.get('/type/:type', asyncHandler(getAllFilesByType));
//
router.get('/:id', asyncHandler(getFileById));
router.get('/name/:name', asyncHandler(getFileByName));
router.get('/chat/:id', asyncHandler(getChatFileById));
router.get('/assistant/:id', asyncHandler(getAssistantFileById));
router.get('/message/:id', asyncHandler(getMessageFileItemsByMessageId));
//
router.post('/', asyncHandler(createFile));
router.post('/chat', asyncHandler(createChatFile));
router.post('/assistant', asyncHandler(createAssistantFile));
router.post('/message', asyncHandler(createMessageFileItems));
router.put('/:id', asyncHandler(updateFile));
router.delete('/:id', asyncHandler(deleteFile));
//
router.get('/download/:id', asyncHandler(downloadFile));
router.post('/upload', upload.single('file'), asyncHandler(uploadFile));
router.post('/upload/single', upload.single('file'), asyncHandler(uploadSingleFile));
router.post('/upload/array', upload.array('files'), asyncHandler(uploadMultipleFiles));
//
router.post('/upsert-docs', asyncHandler(upsertDocs));
router.post('/query-components', asyncHandler(queryComponents));
//
router.get(
  '/static/:filename',
  asyncHandler((req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../../public/static/files', filename);

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
      const files = fs.readdirSync(path.join(__dirname, '../../../public/static/files'));
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
    // const filePath = path.join(__dirname, '../../public/static/files', filename);

    // fs.access(filePath, exists => {
    //   if (!exists) {
    //     return res.status(404).send('File not found');
    //   }
    //   res.sendFile(filePath);
    // });
  })
);
router.get(
  '/static/list',
  asyncHandler((req, res) => {
    const files = fs.readdirSync(path.join(__dirname, '../../public/static/files'));
    res.json({ files });
  })
);

module.exports = router;
