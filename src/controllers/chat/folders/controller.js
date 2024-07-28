// controllers/folderController.js
const folderService = require('./service');

const getFolders = async (req, res) => {
  try {
    const folders = await folderService.getFolders(req.query.workspace_id);
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFolder = async (req, res) => {
  try {
    const folder = await folderService.createFolder(req.body);
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateFolder = async (req, res) => {
  try {
    const folder = await folderService.updateFolder(req.params.id, req.body);
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const message = await folderService.deleteFolder(req.params.id);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
};
