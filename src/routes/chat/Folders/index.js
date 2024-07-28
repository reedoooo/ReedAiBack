const express = require('express');
const { Folder } = require('../../../models');
const router = express.Router();
const controller = require('../../../controllers').chat;
const { getFolders, createFolder, updateFolder, deleteFolder } =
  controller.folders;

// Chat Folders Routes
router.post('/', createFolder);
router.get('/:userId/retrieveFolders', getFolders);
router.put('/:folderId/update', updateFolder);
router.delete('/:folderId/delete', deleteFolder);
router.get('/:workspaceId/retrieveFolders', async (req, res) => {
  try {
    const folders = await Folder.find({ workspaceId: req.params.workspaceId });
    res.json({ folders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
