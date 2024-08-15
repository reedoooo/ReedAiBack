const { Folder: WorkspaceFolder, User, Workspace } = require('@/models');

const getFoldersByWorkspaceId = async (req, res) => {
  try {
    const workspaceFolder = await WorkspaceFolder.findById(req.params.id);
    if (!workspaceFolder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    res.status(200).json(workspaceFolder);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat folder', error: error.message });
  }
};

const createFolder = async (req, res) => {
  try {
    const newWorkspaceFolder = new WorkspaceFolder(req.body);
    const savedWorkspaceFolder = await newWorkspaceFolder.save();
    await Workspace.findByIdAndUpdate(req.body.workspaceId, { $push: { folders: savedWorkspaceFolder._id } });
    await User.findByIdAndUpdate(req.body.userId, { $push: { folders: savedWorkspaceFolder._id } });

    res.status(201).json(savedWorkspaceFolder);
  } catch (error) {
    res.status(400).json({ message: 'Error creating chat folder', error: error.message });
  }
};

const updateFolder = async (req, res) => {
  try {
    const updatedWorkspaceFolder = await WorkspaceFolder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedWorkspaceFolder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    await updatedWorkspaceFolder.save();
    res.status(200).json(updatedWorkspaceFolder);
  } catch (error) {
    res.status(400).json({ message: 'Error updating chat folder', error: error.message });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const folder = await WorkspaceFolder.findByIdAndDelete(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    await Workspace.updateMany({}, { $pull: { folders: folder._id } });
    await User.updateMany({}, { $pull: { folders: folder._id } });

    res.status(200).json({ message: 'Chat folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat folder', error: error.message });
  }
};

module.exports = {
  getFoldersByWorkspaceId,
  createFolder,
  updateFolder,
  deleteFolder,
};
