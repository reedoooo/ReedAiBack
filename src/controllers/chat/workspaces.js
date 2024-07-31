const { logger } = require('../../config');
const { Workspace } = require('../../models');

const getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find();
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspaces', error: error.message });
  }
};

const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('chatSessions').populate('folders');
    logger.info(`workspace: ${workspace}`);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspace', error: error.message });
  }
};

const createWorkspace = async (req, res) => {
  try {
    const newWorkspace = new Workspace(req.body);
    const savedWorkspace = await newWorkspace.save();
    res.status(201).json(savedWorkspace);
  } catch (error) {
    res.status(400).json({ message: 'Error creating workspace', error: error.message });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    const updatedWorkspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedWorkspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.status(200).json(updatedWorkspace);
  } catch (error) {
    res.status(400).json({ message: 'Error updating workspace', error: error.message });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    const deletedWorkspace = await Workspace.findByIdAndDelete(req.params.id);
    if (!deletedWorkspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    res.status(200).json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workspace', error: error.message });
  }
};

module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
};
