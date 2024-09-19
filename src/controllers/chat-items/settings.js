const { logger } = require('@/config/logging');
const {
  Preset: ChatPreset,
  Tool: ChatTool,
  Model: ChatModel,
  Prompt,
  Collection: ChatCollection,
  User,
  Workspace,
  Folder,
} = require('@/models');

const createChatSettingsController = (Model, entityName) => {
  return {
    getAll: async (req, res) => {
      try {
        const entities = await Model.find();
        res.status(200).json(entities);
      } catch (error) {
        res.status(500).json({ message: `Error fetching ${entityName}s`, error: error.message });
      }
    },

    getById: async (req, res) => {
      try {
        const entity = await Model.findById(req.params.id);
        if (!entity) {
          return res.status(404).json({ message: `${entityName} not found` });
        }
        res.status(200).json(entity);
      } catch (error) {
        res.status(500).json({ message: `Error fetching ${entityName}`, error: error.message });
      }
    },
    create: async (req, res) => {
      try {
        logger.info(`Creating new ${entityName}: ${JSON.stringify(req.body)}`);
        const { userId, workspaceId, folderId, ...entityData } = req.body;

        const newEntity = new Model(entityData);
        const savedEntity = await newEntity.save();

        const updatePromises = [];

        if (userId) {
          updatePromises.push(
            User.findByIdAndUpdate(
              userId,
              { $push: { [`${entityName.toLowerCase()}s`]: savedEntity._id } },
              { new: true }
            )
          );
        }

        if (workspaceId) {
          updatePromises.push(
            Workspace.findByIdAndUpdate(
              workspaceId,
              { $push: { [`${entityName.toLowerCase()}s`]: savedEntity._id } },
              { new: true }
            )
          );
        }

        if (folderId) {
          updatePromises.push(
            Folder.findByIdAndUpdate(
              folderId,
              { $push: { [`${entityName.toLowerCase()}s`]: savedEntity._id } },
              { new: true }
            )
          );
        }

        await Promise.all(updatePromises);

        res.status(201).json({
          message: `${entityName} created successfully and associated with user, workspace, and/or folder`,
          data: savedEntity,
        });
      } catch (error) {
        res.status(400).json({ message: `Error creating ${entityName}`, error: error.message });
      }
    },
    // create: async (req, res) => {
    //   try {
    //     logger.info(`Creating new ${entityName}: ${JSON.stringify(req.body)}`);
    //     const newEntity = new Model(req.body);
    //     const savedEntity = await newEntity.save();
    //     res.status(201).json({
    //       message: `${entityName} created successfully`,
    //       data: savedEntity,
    //     });
    //   } catch (error) {
    //     res.status(400).json({ message: `Error creating ${entityName}`, error: error.message });
    //   }
    // },

    update: async (req, res) => {
      try {
        const updatedEntity = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEntity) {
          return res.status(404).json({ message: `${entityName} not found` });
        }
        res.status(200).json(updatedEntity);
      } catch (error) {
        res.status(400).json({ message: `Error updating ${entityName}`, error: error.message });
      }
    },

    delete: async (req, res) => {
      try {
        const deletedEntity = await Model.findByIdAndDelete(req.params.id);
        if (!deletedEntity) {
          return res.status(404).json({ message: `${entityName} not found` });
        }
        res.status(200).json({ message: `${entityName} deleted successfully` });
      } catch (error) {
        res.status(500).json({ message: `Error deleting ${entityName}`, error: error.message });
      }
    },
  };
};

const ChatPresetController = createChatSettingsController(ChatPreset, 'Chat preset');
const ChatToolController = createChatSettingsController(ChatTool, 'Chat tool');
const ChatModelController = createChatSettingsController(ChatModel, 'Chat model');
const ChatPromptController = createChatSettingsController(Prompt, 'Prompt');
const ChatCollectionController = createChatSettingsController(ChatCollection, 'Chat collection');

module.exports = {
  ChatPresetController,
  ChatToolController,
  ChatModelController,
  ChatPromptController,
  ChatCollectionController,
};
