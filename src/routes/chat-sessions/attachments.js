const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  getAllFiles,
  getAllFilesByType,
  getStoredFilesByType,
  getStoredFilesBySpace,
  getStoredFileByName,
  createMessageFileItems,
  uploadFileToStorage,
  getFileById,
  getChatFileById,
  getAssistantFileById,
  createFile,
  updateFile,
  getFileByName,
  createChatFile,
  createAssistantFile,
  getMessageFileItemsByMessageId,
  getMessagesByChatSessionId,
  getMessageById,
  createMessage,
  createMessages,
  updateMessage,
  deleteMessage,
  deleteMessagesIncludingAndAfter,
  getListFiles,
  getFile,
  getDownloads,
  downloadCustomPrompts,
  getAllStaticJsonFiles,
  addCustomPrompt,
  getAllPngFiles,
  getFileByType,
  getStorage,
  getStaticFile,
  getStaticFilesByType,
  getAllStaticFiles,
  uploadFileToBucket,
  downloadFileFromBucket,
  deleteFileFromBucket,
  listFilesInBucket,
  // handleFileUploadFunction,
} = require('@/controllers');
const { asyncHandler } = require('@/utils/api');
const { logger } = require('@/config/logging');
const { upload, handleUploadError, getGFS } = require('@/db');
const { default: mongoose } = require('mongoose');
const { Workspace, Folder, User } = require('@/models');
// const { upload } = require('@/middlewares/upload');

const router = express.Router();

const handleFileUpload = asyncHandler(async (req, res) => {
  upload.single('file')(req, res, async err => {
    if (err) {
      logger.error(`File upload error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      let { workspaceId, userId, folderId } = req.body;

      // Remove extra quotes if present
      workspaceId = workspaceId.replace(/^"|"$/g, '');
      userId = userId.replace(/^"|"$/g, '');
      folderId = folderId === 'undefined' ? undefined : folderId.replace(/^"|"$/g, '');

      logger.info(`Attempting to associate file with Workspace: ${workspaceId}, User: ${userId}, Folder: ${folderId}`);

      // Update Workspace, Folder, and User models
      const updatePromises = [
        Workspace.findByIdAndUpdate(
          workspaceId,
          { $push: { files: req.file.id } },
          { new: true, useFindAndModify: false }
        ).exec(),
        User.findByIdAndUpdate(
          userId,
          { $push: { files: req.file.id } },
          { new: true, useFindAndModify: false }
        ).exec(),
      ];

      if (folderId) {
        updatePromises.push(
          Folder.findByIdAndUpdate(
            folderId,
            { $push: { files: req.file.id } },
            { new: true, useFindAndModify: false }
          ).exec()
        );
      }

      const [updatedWorkspace, updatedUser, updatedFolder] = await Promise.all(updatePromises);

      if (!updatedWorkspace) {
        logger.warn(`Workspace ${workspaceId} not found`);
      }
      if (!updatedUser) {
        logger.warn(`User ${userId} not found`);
      }
      if (folderId && !updatedFolder) {
        logger.warn(`Folder ${folderId} not found`);
      }

      logger.info(
        `File ${req.file.id} associated with Workspace ${workspaceId}, User ${userId}${folderId ? `, and Folder ${folderId}` : ''}`
      );

      const fileInfo = {
        id: req.file.id,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        uploadDate: req.file.uploadDate,
        workspaceId,
        userId,
        folderId: folderId || null,
      };

      res.json({
        message: 'File uploaded and associated successfully',
        file: fileInfo,
      });
    } catch (error) {
      logger.error(`Error in file upload handler: ${error.message}`);
      logger.error(`Stack trace: ${error.stack}`);
      res.status(500).json({ error: 'Internal server error during file association' });
    }
  });
});
const getStorageFiles = asyncHandler(async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });

    const files = await bucket.find().toArray();

    const fileList = await Promise.all(
      files.map(async file => {
        const workspace = await Workspace.findOne({ files: file._id });
        const folder = await Folder.findOne({ files: file._id });
        const user = await User.findOne({ files: file._id });

        return {
          id: file._id.toString(),
          filename: file.filename,
          contentType: file.contentType,
          size: file.length,
          uploadDate: file.uploadDate,
          workspaceId: workspace ? workspace._id : null,
          folderId: folder ? folder._id : null,
          userId: user ? user._id : null,
        };
      })
    );

    res.json(fileList);
  } catch (error) {
    logger.error('Error fetching files from storage:', error);
    res.status(500).json({ error: 'Error fetching files from storage' });
  }
});
// File retrieval routes
router.get('/', asyncHandler(getAllFiles));
router.get('/type/:type', asyncHandler(getAllFilesByType));
router.get('/:id', asyncHandler(getFileById));
router.get('/name/:name', asyncHandler(getFileByName));
router.get('/chat/:id', asyncHandler(getChatFileById));
router.get('/assistant/:id', asyncHandler(getAssistantFileById));
router.get('/message/:messageId', asyncHandler(getMessageFileItemsByMessageId));

// File creation and update routes
router.post('/', asyncHandler(createFile));
router.post('/chat', asyncHandler(createChatFile));
router.post('/assistant', asyncHandler(createAssistantFile));
router.post('/message', asyncHandler(createMessageFileItems));
router.put('/:id', asyncHandler(updateFile));

router.post('/upload', handleFileUpload);
router.get('/storage', getStorageFiles);
router.get('/storage/type/:type', asyncHandler(getStoredFilesByType));
router.get('/storage/space/:space', asyncHandler(getStoredFilesBySpace));
router.get('/storage/filename/:filename', asyncHandler(getStoredFileByName));

// Message routes
router.get('/messages/session/:sessionId', asyncHandler(getMessagesByChatSessionId));
router.get('/messages/:id', asyncHandler(getMessageById));
router.post('/messages', asyncHandler(createMessage));
router.post('/messages/bulk', asyncHandler(createMessages));
router.put('/messages/:id', asyncHandler(updateMessage));
router.delete('/messages/:id', asyncHandler(deleteMessage));
router.delete('/messages', asyncHandler(deleteMessagesIncludingAndAfter));

// Static file routes
router.get('/downloads/:filename', asyncHandler(getDownloads));
router.get('/downloads/custom-prompts', asyncHandler(downloadCustomPrompts));
router.get('/static/list', asyncHandler(getListFiles));
router.get('/static/:filePath', asyncHandler(getFile));
router.get('/static/json/all', asyncHandler(getAllStaticJsonFiles));
router.post('/static/custom-prompts', asyncHandler(addCustomPrompt));
router.get('/static/png/all', asyncHandler(getAllPngFiles));
router.get('/static/:type', asyncHandler(getFileByType));
router.get('/static/:filename', asyncHandler(getStaticFile));
router.get('/static/list/:filetype', asyncHandler(getStaticFilesByType));
router.get('/static/list', asyncHandler(getAllStaticFiles));

module.exports = router;
