// controllers/workspaceController.js
const workspaceService = require('./service');

const createHomeWorkspace = async (req, res) => {
  const { userId } = req.params;
  try {
    const workspaceId = await workspaceService.createHomeWorkspace(userId);
    res.status(201).json({ workspaceId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadWorkspaceImage = async (req, res) => {
  const { workspaceId } = req.params;
  const image = req.file;

  if (!image) {
    return res.status(400).send('No file uploaded');
  }

  try {
    const imagePath = await workspaceService.uploadWorkspaceImage(workspaceId, image.path);
    res.status(200).json({ imagePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkspaceImage = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const imagePath = await workspaceService.getWorkspaceImage(workspaceId);
    res.sendFile(imagePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHomeWorkspaceByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const homeWorkspace = await workspaceService.getHomeWorkspaceByUserId(userId);
    res.status(200).json(homeWorkspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkspaceByWorkspaceId = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const workspace = await workspaceService.getWorkspaceById(workspaceId);
    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWorkspacesByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const workspaces = await workspaceService.getWorkspacesByUserId(userId);
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createWorkspace = async (req, res) => {
  try {
    const workspace = await workspaceService.createWorkspace(req.body);
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const workspace = await workspaceService.updateWorkspace(workspaceId, req.body);
    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  try {
    const message = await workspaceService.deleteWorkspace(workspaceId);
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createHomeWorkspace,
  uploadWorkspaceImage,
  getWorkspaceImage,
  getHomeWorkspaceByUserId,
  getWorkspaceByWorkspaceId,
  getWorkspacesByUserId,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
