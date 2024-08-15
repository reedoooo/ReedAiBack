const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const authenticate = require('@/middlewares/authenticate.js');
const { getFoldersByWorkspaceId, createFolder, updateFolder, deleteFolder } = require('@/controllers');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getFoldersByWorkspaceId));
router.post('/', asyncHandler(createFolder));
router.put('/:id', asyncHandler(updateFolder));
router.delete('/:id', asyncHandler(deleteFolder));

module.exports = router;
