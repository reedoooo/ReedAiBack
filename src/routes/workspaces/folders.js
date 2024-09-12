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
  getFoldersBySpace,
} = require('@/controllers');

const router = express.Router();

// router.use(authenticate);

// router.get('/space/:space', asyncHandler(getFoldersBySpace));
router.get('/space/:space', async (req, res) => {
  try {
    const spaceName = req.params.space;
    const { page, limit, sortBy, sortOrder } = req.query;

    const result = await getFoldersBySpace(spaceName, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    });

    res.json({
      message: `Folders in space '${spaceName}' fetched successfully`,
      ...result,
    });
  } catch (error) {
    console.error(`Error in /folders/:space route: ${error.message}`);
    res.status(500).json({ error: 'Error fetching folders', message: error.message });
  }
});
router.get('/', asyncHandler(getWorkspaceFoldersByWorkspaceId));
router.get('/', asyncHandler(getFolderItemsByFolderId));
router.post('/', asyncHandler(createFolder));
router.put('/:id', asyncHandler(updateFolder));
router.delete('/:id', asyncHandler(deleteFolder));

module.exports = router;
