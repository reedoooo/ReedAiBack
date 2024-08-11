const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const {
  getAllChatFiles,
  getChatFileById,
  createChatFile,
  updateChatFile,
  deleteChatFile,
  // getChatFilesList,
  // getFileWorkspacesByWorkspaceId,
} = require('../../controllers/index.js');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllChatFiles));
router.get('/:id', asyncHandler(getChatFileById));
router.post('/', asyncHandler(createChatFile));
router.put('/:id', asyncHandler(updateChatFile));
router.delete('/:id', asyncHandler(deleteChatFile));

// Additional routes for file-specific operations
// router.get('/:id/list', asyncHandler(getChatFilesList));
// router.get('/:workspaceId/workspace', asyncHandler(getFileWorkspacesByWorkspaceId));

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
