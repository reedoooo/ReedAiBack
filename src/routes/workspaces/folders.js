const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
// const {
// getWorkspaceFoldersByWorkspaceId,
// getFolderItemsByFolderId,
// createFolder,
// updateFolder,
// deleteFolder,
// } = require('@/config/env/controllers/folders');
const { authenticate } = require('@/middlewares/authenticate');
const {
  getWorkspaceFoldersByWorkspaceId,
  getFolderItemsByFolderId,
  createFolder,
  updateFolder,
  deleteFolder,
} = require('@/controllers');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getWorkspaceFoldersByWorkspaceId));
router.get('/', asyncHandler(getFolderItemsByFolderId));
router.post('/', asyncHandler(createFolder));
router.put('/:id', asyncHandler(updateFolder));
router.delete('/:id', asyncHandler(deleteFolder));

module.exports = router;
