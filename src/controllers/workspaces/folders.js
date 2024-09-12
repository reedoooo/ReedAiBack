const { Folder: WorkspaceFolder, User, Workspace } = require('@/models');

/**
 * Fetches all folders with a given space name.
 * @async
 * @function getFoldersBySpace
 * @param {string} spaceName - The name of the space to filter folders by
 * @param {Object} options - Additional options for pagination and sorting
 * @param {number} [options.page=1] - The page number for pagination
 * @param {number} [options.limit=10] - The number of folders per page
 * @param {string} [options.sortBy='createdAt'] - The field to sort by
 * @param {string} [options.sortOrder='desc'] - The sort order ('asc' or 'desc')
 * @returns {Promise<Object>} An object containing the folders and pagination info
 * @throws {Error} If there's an error fetching the folders
 */
const getFoldersBySpace = async (spaceName, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const query = { space: spaceName };

    const [folders, total] = await Promise.all([
      WorkspaceFolder.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('workspaceId', 'name')
        .lean(),
        WorkspaceFolder.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      folders,
      pagination: {
        currentPage: page,
        totalPages,
        totalFolders: total,
        foldersPerPage: limit
      }
    };
  } catch (error) {
    console.error(`Error fetching folders by space: ${error.message}`);
    throw new Error('Failed to fetch folders');
  }
};

const getWorkspaceFoldersByWorkspaceId = async (req, res) => {
  try {
    const workspaceFolder = await WorkspaceFolder.findById(req.params.id).populate('items'); {

    }
    if (!workspaceFolder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    res.status(200).json(workspaceFolder);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat folder', error: error.message });
  }
};

const getWorkspaceFolderByFolderId = async (req, res) => {
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

const getFolderItemsByFolderId = async (req, res) => {
  try {
    const folder = await WorkspaceFolder.findById(req.params.id).populate('items');
    if (!folder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat folder', error: error.message });
  }
};

const getFolderItemByItemId = async (req, res) => {
  try {
    const folder = await WorkspaceFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Chat folder not found' });
    }
    res.status(200).json(folder);
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
  getWorkspaceFoldersByWorkspaceId,
  getWorkspaceFolderByFolderId,
  getFolderItemsByFolderId,
  getFolderItemByItemId,
  createFolder,
  updateFolder,
  deleteFolder,
  getFoldersBySpace,
};
