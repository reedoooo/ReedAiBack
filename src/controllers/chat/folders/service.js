// services/folderService.js
const { Folder } = require('../../../models');

const getFolders = async workspace_id => {
  try {
    return await Folder.find({ workspace_id });
  } catch (error) {
    throw new Error('Error fetching folders');
  }
};

const createFolder = async folderData => {
  try {
    const folder = new Folder(folderData);
    await folder.save();
    return folder;
  } catch (error) {
    throw new Error('Error creating folder');
  }
};

const updateFolder = async (id, folderData) => {
  try {
    const folder = await Folder.findByIdAndUpdate(id, folderData, { new: true });
    if (!folder) {
      throw new Error('Folder not found');
    }
    return folder;
  } catch (error) {
    throw new Error('Error updating folder');
  }
};

const deleteFolder = async id => {
  try {
    const folder = await Folder.findByIdAndDelete(id);
    if (!folder) {
      throw new Error('Folder not found');
    }
    return { message: 'Folder deleted successfully' };
  } catch (error) {
    throw new Error('Error deleting folder');
  }
};

module.exports = {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
};
