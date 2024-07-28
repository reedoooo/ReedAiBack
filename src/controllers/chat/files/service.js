const { File } = require('../../../models');

const getFiles = async workspaceId => {
  try {
    const files = await File.find({ workspaceId: workspaceId });
    return files;
  } catch (error) {
    throw new Error(error.message);
  }
};

const createFile = async fileData => {
  try {
    const file = new File(fileData);
    await file.save();
    return file;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateFile = async (fileId, fileData) => {
  try {
    const file = await File.findByIdAndUpdate(fileId, fileData, { new: true });
    if (!file) {
      throw new Error('File not found');
    }
    return file;
  } catch (error) {
    throw new Error(error.message);
  }
};

const deleteFile = async fileId => {
  try {
    const file = await File.findByIdAndDelete(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    return { message: 'File deleted successfully' };
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  getFiles,
  createFile,
  updateFile,
  deleteFile,
};
