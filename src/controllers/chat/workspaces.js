const { default: mongoose } = require('mongoose');
const logger = require('../../config/logging');
const {
  Workspace,
  ChatSession,
  Folder,
  Preset,
  Tool,
  Model,
  Prompt,
  User,
} = require('@/models');

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
    const newWorkspace = new Workspace({
      userId: workspaceData.userId,
      name: workspaceData.name,
      active: true,
    });
    const savedWorkspace = await newWorkspace.save();
    const { prompt, file, folder, tool, model, asisstant } = workspaceData;
    const presetData = workspaceData.customPreset;
    // --- PRESET CREATION ---
    const newCustomPreset = {
      ...presetData,
      userId: workspaceData.userId,
      workspaceId: savedWorkspace._id,
      name: workspaceData.name,
      includeProfileContext: false, // Set default value or get from request
      includeWorkspaceInstructions: false, // Set default value or get from request
      model: workspaceData.model,
      prompt: '', // Assuming prompt can be an empty string initially
      sharing: '', // Assuming sharing can be an empty string initially
    };
    const newPreset = new Preset(newCustomPreset);
    const savedPreset = await newPreset.save();
    const newPrompt = new Prompt(prompt);
    const savedPrompt = await newPrompt.save();
    const newFolder = new Folder(folder);
    const savedFolder = await newFolder.save();
    const newTool = new Tool(tool);
    const savedTool = await newTool.save();
    const newModel = new Model(model);
    const savedModel = await newModel.save();

    savedWorkspace.presets.push(savedPreset._id);
    savedWorkspace.prompts.push(savedPrompt._id);
    savedWorkspace.models.push(savedModel._id);
    savedWorkspace.tools.push(savedTool._id);
    savedWorkspace.folders.push(savedFolder._id);
    savedWorkspace.selectedPreset = savedPreset._id;
    await savedWorkspace.save();
    // Push the new workspace ID into the user's workspaces array
    const user = await User.findById(req.user._id); // Assuming req.user contains the authenticated user's ID
    user.workspaces.push(savedWorkspace._id);
    user.presets.push(savedPreset._id);
    await user.save();
    // await newWorkspace
    //   .populate(
    //     'userId chatSessions activeChatSession folders defaultPreset defaultTool defaultModel defaultPrompt defaultCollection defaultFile defaultAssistant'
    //   )
    //   .execPopulate();
    const responseObj = {
      workspace: await savedWorkspace
        .populate('presets')
        .populate('prompts')
        .populate('models')
        .populate('tools')
        .populate('folders')
        .execPopulate(),

      preset: savedPreset,
    };
    logger.info(`responseObj: ${JSON.stringify(responseObj)}`);
    res.status(201).json(newWorkspace);
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
};
