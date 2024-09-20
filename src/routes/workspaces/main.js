const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
const { authenticate } = require('passport');
const {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  fetchWorkspaceAndFolders,
  fetchWorkspaceAndChatSessions,
  fetchWorkspaceAndChatSession,
} = require('@/controllers');

const router = express.Router();

router.get('/', asyncHandler(getAllWorkspaces));
router.get('/:workspaceId/folders/space/:space', async (req, res) => {
  try {
    const { workspaceId, space } = req.params;
    // const { space } = req.query;
    const result = await fetchWorkspaceAndFolders(workspaceId, space);

    // const result = await getFoldersBySpace(spaceName, {
    //   page: parseInt(page),
    //   limit: parseInt(limit),
    //   sortBy,
    //   sortOrder,
    // });

    res.json({
      message: `Workspace and folders fetched successfully, space: ${space}, result: ${JSON.stringify(result)}`,
      workspace: result.workspace,
      folders: result.folders,
      // ...result,
    });
  } catch (error) {
    console.error(`Error in /folders/:space route: ${error.message}`);
    res.status(500).json({ error: 'Error fetching folders', message: error.message });
  }
});
router.get('/:workspaceId/folders/:folderId', async (req, res) => {
  try {
    const { workspaceId, folderId } = req.params;
    // const { space } = req.query;
    const result = await fetchWorkspaceAndFolders(workspaceId, folderId);

    res.json({
      message: `Workspace and folder fetched successfully, workspaceId: ${workspaceId}, folderId: ${folderId}, result: ${JSON.stringify(result)}`,
      workspace: result.workspace,
      folder: result.folder,
      //...result,
    });
  } catch (error) {
    console.error(`Error in /folders/:space route: ${error.message}`);
    res.status(500).json({ error: 'Error fetching folders', message: error.message });
  }
});
router.get('/:workspaceId/folders/:folderId/items', async (req, res) => {
  try {
    const { workspaceId, folderId } = req.params;
    // const { space } = req.query;
    const result = await fetchWorkspaceAndFolders(workspaceId, folderId);

    res.json({
      message: `Workspace and folder fetched successfully, workspaceId: ${workspaceId}, folderId: ${folderId}, result: ${JSON.stringify(result)}`,
      workspace: result.workspace,
      folder: result.folder,
      //...result,
    });
  } catch (error) {
    console.error(`Error in /folders/:space route: ${error.message}`);
    res.status(500).json({ error: 'Error fetching folders', message: error.message });
  }
});
router.get('/:workspaceId/folders/:folderId/items/:itemId', async (req, res) => {
  try {
    const { workspaceId, folderId, itemId } = req.params;
    // const { space } = req.query;
    const result = await fetchWorkspaceAndFolders(workspaceId, folderId, itemId);

    res.json({
      message: `Workspace and folder fetched successfully, workspaceId: ${workspaceId}, folderId: ${folderId}, itemId: ${itemId}, result: ${JSON.stringify(result)}`,
      workspace: result.workspace,
      folder: result.folder,
      item: result.item,
      //...result,
    });
  } catch (error) {
    console.error(`Error in /folders/:space route: ${error.message}`);
    res.status(500).json({ error: 'Error fetching folders', message: error.message });
  }
});
router.get('/:workspaceId/chatSessions', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    // const { space } = req.query;
    const result = await fetchWorkspaceAndChatSessions(workspaceId);

    res.json({
      message: `Workspace and chatSessions fetched successfully, workspaceId: ${workspaceId}, result: ${JSON.stringify(result)}`,
      workspace: result.workspace,
      chatSessions: result.chatSessions,
      // ...result,
    });
  } catch (error) {
    console.error(`Error in /sessions/:space route: ${error.message}`);
    res.status(500).json({ error: 'Error fetching folders', message: error.message });
  }
});
router.get('/:workspaceId/chatSessions/:chatSessionId', async (req, res) => {
  try {
    const { workspaceId, chatSessionId } = req.params;
    const result = await fetchWorkspaceAndChatSession(workspaceId, chatSessionId);

    res.json({
      message: `Workspace and chat session fetched successfully, workspaceId: ${workspaceId}, chatSessionId: ${chatSessionId}`,
      workspace: result.workspace,
      chatSession: result.chatSession,
    });
  } catch (error) {
    console.error(`Error in /chatSessions/:chatSessionId route: ${error.message}`);
    res.status(500).json({ error: 'Error fetching chat session', message: error.message });
  }
});
// router.get('/folders/:space', asyncHandler(getAllWorkspaces));
router.get('/:id', asyncHandler(getWorkspaceById));
router.post('/create', asyncHandler(createWorkspace));
router.put('/:id', asyncHandler(updateWorkspace));
router.delete('/:id', asyncHandler(deleteWorkspace));

module.exports = router;
