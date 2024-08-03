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
  Collection,
  File,
  Assistant,
} = require('../../models');

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

// const createWorkspace = async (req, res) => {
//   try {
//     const newWorkspace = new Workspace(req.body);
//     const savedWorkspace = await newWorkspace.save();
//     res.status(201).json(savedWorkspace);
//   } catch (error) {
//     res.status(400).json({ message: 'Error creating workspace', error: error.message });
//   }
// };

// Controller function for creating a new workspace
const createWorkspace = async (req, res) => {
  try {
    const {
      userId,
      chatSessions,
      activeChatSession,
      folders,
      defaultPreset,
      defaultTool,
      defaultModel,
      defaultPrompt,
      defaultCollection,
      defaultFile,
      defaultAssistant,
      name,
      description,
      imagePath,
      active,
      defaultContextLength,
      defaultTemperature,
      embeddingsProvider,
      instructions,
      sharing,
      includeProfileContext,
      includeWorkspaceInstructions,
      isHome,
    } = req.body;

    // Create referenced documents if provided in the request body
    const chatSessionDocs = chatSessions ? await ChatSession.insertMany(chatSessions) : [];
    const folderDocs = folders ? await Folder.insertMany(folders) : [];
    const presetDoc = defaultPreset ? await Preset.create(defaultPreset) : undefined;
    const toolDoc = defaultTool ? await Tool.create(defaultTool) : undefined;
    const modelDoc = defaultModel ? await Model.create(defaultModel) : undefined;
    const promptDoc = defaultPrompt ? await Prompt.create(defaultPrompt) : undefined;
    const collectionDoc = defaultCollection ? await Collection.create(defaultCollection) : undefined;
    const fileDoc = defaultFile ? await File.create(defaultFile) : undefined;
    const assistantDoc = defaultAssistant ? await Assistant.create(defaultAssistant) : undefined;

    // Create the new workspace document
    const newWorkspace = new Workspace({
      userId: mongoose.Types.ObjectId(userId),
      chatSessions: chatSessionDocs.map(doc => doc._id),
      activeChatSession: activeChatSession ? mongoose.Types.ObjectId(activeChatSession) : null,
      folders: folderDocs.map(doc => doc._id),
      defaultPreset: presetDoc ? presetDoc._id : null,
      defaultTool: toolDoc ? toolDoc._id : null,
      defaultModel: modelDoc ? modelDoc._id : null,
      defaultPrompt: promptDoc ? promptDoc._id : null,
      defaultCollection: collectionDoc ? collectionDoc._id : null,
      defaultFile: fileDoc ? fileDoc._id : null,
      defaultAssistant: assistantDoc ? assistantDoc._id : null,
      name,
      description,
      imagePath,
      active,
      defaultContextLength,
      defaultModel,
      defaultTemperature,
      embeddingsProvider,
      instructions,
      sharing,
      includeProfileContext,
      includeWorkspaceInstructions,
      isHome,
    });

    // Save the workspace to the database
    await newWorkspace.save();

    // Populate all references in the workspace before returning
    await newWorkspace
      .populate(
        'userId chatSessions activeChatSession folders defaultPreset defaultTool defaultModel defaultPrompt defaultCollection defaultFile defaultAssistant'
      )
      .execPopulate();

    res.status(201).json(newWorkspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
