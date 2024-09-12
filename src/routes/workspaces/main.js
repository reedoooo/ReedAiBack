const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
// const {
//   getAllWorkspaces,
//   getWorkspaceById,
//   createWorkspace,
//   updateWorkspace,
//   deleteWorkspace,
// } = require('../../config/env/controllers/index.js');
const { authenticate } = require('passport');
const {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} = require('@/controllers');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Workspaces
 *   description: API to manage workspaces.
 */

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: Get all workspaces
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: List of all workspaces
 */

/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Get a workspace by ID
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace details
 */

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     responses:
 *       201:
 *         description: Workspace created
 */

// Define routes and handlers here

router.use(authenticate);
router.get('/', asyncHandler(getAllWorkspaces));
router.get('/:id', asyncHandler(getWorkspaceById));
router.post('/create', asyncHandler(createWorkspace));
router.put('/:id', asyncHandler(updateWorkspace));
router.delete('/:id', asyncHandler(deleteWorkspace));

module.exports = router;
