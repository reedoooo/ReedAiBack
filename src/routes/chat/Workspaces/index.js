const express = require('express');
const router = express.Router();
const { handleUpload } = require('../../../middlewares/uploads');
const controller = require('../../../controllers').chat;
const {
  createHomeWorkspace,
  getWorkspaceImage,
  getHomeWorkspaceByUserId,
  getWorkspacesByUserId,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceByWorkspaceId,
  uploadWorkspaceImage,
} = controller.workspaces;

// Chat Workspaces Routes
router.post('/create-home/:userId', createHomeWorkspace);
router.post(
  '/upload/:workspaceId',
  (req, res, next) => {
    req.fileType = 'image';
    handleUpload.file(req, res, next);
  },
  uploadWorkspaceImage
);
// router.post('/upload/:workspaceId', upload.single('image'), uploadWorkspaceImage);
router.post('/', createWorkspace);
router.get('/user/:userId', getWorkspacesByUserId);
router.get('/image/:workspaceId', getWorkspaceImage);
router.get('/home/:userId', getHomeWorkspaceByUserId);
router.put('/:workspaceId', updateWorkspace);
router.delete('/:workspaceId', deleteWorkspace);

// --- NEW ---
router.get('/:id', getWorkspaceByWorkspaceId);

module.exports = router;
