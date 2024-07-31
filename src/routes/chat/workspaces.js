const express = require('express');
const { asyncHandler } = require('../../utils/api/sync.js');
const authenticate = require('../../middlewares/authenticate.js');
const {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = require('../../controllers/index.js');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(getAllWorkspaces));
router.get('/:id', asyncHandler(getWorkspaceById));
router.post('/', asyncHandler(createWorkspace));
router.put('/:id', asyncHandler(updateWorkspace));
router.delete('/:id', asyncHandler(deleteWorkspace));

module.exports = router;
