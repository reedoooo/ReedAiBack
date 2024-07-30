const express = require('express');
const router = express.Router();
const { handleUpload } = require('../../../middlewares/uploads');
const { Workspace } = require('../../../models');
const controller = require('../../../controllers').chat;
const { getAssistantImage, uploadAssistantImage, getAssistants, createAssistant, updateAssistant, deleteAssistant } =
  controller.assistants;
// Chat Assistants Routes
router.get('/:assistantId/image', getAssistantImage);
router.post(
  '/upload/:assistantId/image',
  (req, res, next) => {
    req.fileType = 'image';
    handleUpload.file(req, res, next);
  },
  uploadAssistantImage
);
router.post('/', getAssistants);
router.post('/create', createAssistant);
router.put('/update', updateAssistant);
router.delete('/delete', deleteAssistant);
router.get('/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId).populate('files');
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
