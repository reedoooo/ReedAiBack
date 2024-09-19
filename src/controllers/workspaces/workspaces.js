const { default: mongoose } = require('mongoose');
const { Workspace, ChatSession, Folder, Preset, Tool, Model, Prompt, User } = require('@/models');
const { logger } = require('@/config/logging');
const { getDB } = require('@/db');

const getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find();
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspaces', error: error.message });
  }
};

const getAllUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ userId: req.params.userId }).populate('chatSessions').populate('folders');
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspaces', error: error.message });
  }
};
async function fetchWorkspaceAndChatSessions(workspaceId) {
  try {
    // Validate the workspaceId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new Error('Invalid workspace ID');
    }
    logger.info(`Fetching workspace and chat sessions for workspaceId: ${workspaceId}`);
    // Fetch workspace and chat sessions concurrently
    const [workspace, chatSessions] = await Promise.all([
      Workspace.findById(workspaceId).lean().populate('chatSessions'),
      ChatSession.find({ workspaceId }).lean().populate('messages').populate('systemPrompt'),
    ]);
    logger.info(`workspace: ${workspace}`);
    logger.info(`chatSessions: ${chatSessions}`);
    // Check if workspace exists
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Populate workspace with chatSessions
    workspace.chatSessions = chatSessions;

    return {
      workspace,
      chatSessions,
    };
  } catch (error) {
    console.error('Error fetching workspace and chat sessions:', error);
    throw error;
  }
}
async function fetchWorkspaceAndFolders(workspaceId, space) {
  try {
    // Validate the workspaceId
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new Error('Invalid workspace ID');
    }

    // Fetch workspace and folders concurrently
    const [workspace, folders] = await Promise.all([
      Workspace.findById(workspaceId).lean(),
      Folder.find({ workspaceId, space }).lean(),
    ]);

    // Check if workspace exists
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Organize folders into a tree structure if needed
    const folderTree = organizeFoldersIntoTree(folders);

    return {
      workspace,
      folders: folderTree,
    };
  } catch (error) {
    console.error('Error fetching workspace and folders:', error);
    throw error;
  }
}
// Helper function to organize folders into a tree structure
function organizeFoldersIntoTree(folders) {
  const folderMap = {};
  const rootFolders = [];

  // First pass: create a map of all folders
  folders.forEach(folder => {
    folderMap[folder._id.toString()] = { ...folder, children: [] };
  });

  // Second pass: build the tree structure
  folders.forEach(folder => {
    if (folder.parent) {
      const parentFolder = folderMap[folder.parent.toString()];
      if (parentFolder) {
        parentFolder.children.push(folderMap[folder._id.toString()]);
      } else {
        rootFolders.push(folderMap[folder._id.toString()]);
      }
    } else {
      rootFolders.push(folderMap[folder._id.toString()]);
    }
  });

  return rootFolders;
}
const getHomeWorkspace = async (req, res) => {
  const userId = req.params.userId;
  try {
    const db = getDB();
    const homeWorkspace = await db.collection('workspaces').findOne({
      userId: userId,
      isHome: true,
    });
    if (!homeWorkspace) {
      return res.status(404).json({ error: 'Home workspace not found' });
    }
    res.json({ id: homeWorkspace._id });
  } catch (error) {
    console.error('Error retrieving home workspace:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    const workspaceData = req.body;

    // Validate required fields
    if (!workspaceData || !workspaceData.userId || !workspaceData.name) {
      return res.status(400).json({ error: 'Missing required fields: userId or name' });
    }

    // Create a new workspace
    const newWorkspace = new Workspace({
      userId: workspaceData.userId,
      name: workspaceData.name,
      active: true,
    });

    // Save the workspace
    const savedWorkspace = await newWorkspace.save();

    const { prompt, tool, model, folder } = workspaceData;
    const presetData = workspaceData.customPreset;

    // Create a new preset
    const newCustomPreset = {
      ...presetData,
      userId: workspaceData.userId,
      workspaceId: savedWorkspace._id,
      name: workspaceData.name,
      includeProfileContext: false,
      includeWorkspaceInstructions: false,
      model: workspaceData.model,
      prompt: '',
      sharing: '',
    };
    const savedPreset = await new Preset(newCustomPreset).save();

    // Create related documents
    const savedPrompt = await new Prompt(prompt).save();
    const savedTool = await new Tool(tool).save();
    const savedModel = await new Model(model).save();

    // Update workspace with related documents
    savedWorkspace.presets.push(savedPreset._id);
    savedWorkspace.prompts.push(savedPrompt._id);
    savedWorkspace.models.push(savedModel._id);
    savedWorkspace.tools.push(savedTool._id);
    savedWorkspace.selectedPreset = savedPreset._id;

    // Create folders
    const folderTypes = ['chatSessions', 'assistants', 'files', 'models', 'tools', 'presets', 'prompts', 'collections'];

    const folders = folderTypes.map(type => ({
      userId: savedWorkspace.userId,
      workspaceId: savedWorkspace._id,
      name: `${type}_folder`,
      type,
      items: [],
    }));

    const savedFolders = await Folder.insertMany(folders);
    const folderIds = savedFolders.map(folder => folder._id);

    // Update workspace with folders
    await Workspace.findByIdAndUpdate(savedWorkspace._id, { $push: { folders: { $each: folderIds } } }, { new: true });

    // Save the updated workspace
    await savedWorkspace.save();

    // Update user with new workspace and preset
    const user = await User.findById(req.user._id);
    user.workspaces.push(savedWorkspace._id);
    user.presets.push(savedPreset._id);
    await user.save();

    // Prepare response
    const responseObj = {
      workspace: await savedWorkspace
        .populate('presets')
        .populate('prompts')
        .populate('models')
        .populate('tools')
        .populate('folders')
        .populate('chatSessions')
        .populate('assistants')
        .populate('files'),
    };

    res.status(201).json(responseObj);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
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
  getAllUserWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getHomeWorkspace,
  fetchWorkspaceAndFolders,
  organizeFoldersIntoTree,
  fetchWorkspaceAndChatSessions,
};
