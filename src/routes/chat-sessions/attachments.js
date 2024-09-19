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
const { upload, handleUploadError, getGFS, getDB, getBucket } = require('@/db');
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
      // Create a new File document
      // const newFile = new File({
      //   filename: req.file.filename,
      //   originalName: req.file.originalname,
      //   contentType: req.file.contentType,
      //   size: req.file.size,
      //   uploadDate: new Date(),
      //   user: userId,
      //   workspace: workspaceId,
      //   folder: folderId,
      // });

      // await newFile.save();
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
        space: req.body.space,
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
// File retrieval routes
// router.get('/', asyncHandler(getAllFiles));
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

// File upload routes
router.post('/upload', handleFileUpload);
router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    const bucket = getBucket();
    const collection = db.collection('uploads.files');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const files = await collection.find({}).skip(skip).limit(limit).toArray();
    const total = await collection.countDocuments();

    if (!files || files.length === 0) {
      return res.json({ files: [], total: 0, page, limit });
    }

    const fileList = files.map(file => ({
      id: file._id.toString(),
      _id: file._id.toString(),
      workspaceId: file.metadata.workspaceId,
      folderId: file.metadata.folderId,
      filename: file.filename,
      contentType: file.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/files/${file._id}/download`,
    }));

    return res.json({
      message: 'Files fetched successfully',
      files: fileList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error fetching files: ${error.message}`);
    res.status(500).json({ error: 'Error fetching files', message: error.message });
  }
});
router.get('/type/:fileType', async (req, res) => {
  try {
    const db = await getDB();
    const bucket = getBucket();
    const collection = db.collection('uploads.files');

    const fileType = req.params.fileType;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { contentType: new RegExp(fileType, 'i') };
    const files = await collection.find(query).skip(skip).limit(limit).toArray();
    const total = await collection.countDocuments(query);

    if (!files || files.length === 0) {
      return res.json({ files: [], total: 0, page, limit });
    }

    const fileList = files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      contentType: file.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/files/${file._id}/download`,
    }));

    return res.json({
      message: `Files of type ${fileType} fetched successfully`,
      files: fileList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error fetching files by type: ${error.message}`);
    res.status(500).json({ error: 'Error fetching files by type', message: error.message });
  }
});
router.get('/name/:fileName', async (req, res) => {
  try {
    const db = await getDB();
    const bucket = getBucket();
    const collection = db.collection('uploads.files');

    const fileName = req.params.fileName;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { filename: new RegExp(fileName, 'i') };
    const files = await collection.find(query).skip(skip).limit(limit).toArray();
    const total = await collection.countDocuments(query);

    if (!files || files.length === 0) {
      return res.json({ files: [], total: 0, page, limit });
    }

    const fileList = files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      contentType: file.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/files/${file._id}/download`,
    }));

    return res.json({
      message: `Files with name containing '${fileName}' fetched successfully`,
      files: fileList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error fetching files by name: ${error.message}`);
    res.status(500).json({ error: 'Error fetching files by name', message: error.message });
  }
});
router.get('/space/:space', async (req, res) => {
  try {
    const db = await getDB();
    const bucket = getBucket();
    const collection = db.collection('uploads.files');

    const space = req.params.space;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { 'metadata.space': space };
    const files = await collection.find(query).skip(skip).limit(limit).toArray();
    const total = await collection.countDocuments(query);

    if (!files || files.length === 0) {
      return res.json({ files: [], total: 0, page, limit });
    }

    const fileList = files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      contentType: file.contentType,
      size: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata,
      url: `/api/files/${file._id}/download`,
    }));

    return res.json({
      message: `Files in space '${space}' fetched successfully`,
      files: fileList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error fetching files by space: ${error.message}`);
    res.status(500).json({ error: 'Error fetching files by space', message: error.message });
  }
});
router.get(
  '/:id/stream',
  asyncHandler(async (req, res) => {
    const fileId = req.params.id;

    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads',
      });

      const file = await bucket.find({ _id: mongoose.Types.ObjectId(fileId) }).toArray();

      if (!file || file.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.set('Content-Type', file[0].contentType);

      const readStream = bucket.openDownloadStream(mongoose.Types.ObjectId(fileId));

      readStream.on('error', err => {
        return res.status(500).json({ error: `Error streaming file: ${err.message}` });
      });

      readStream.pipe(res);
    } catch (error) {
      logger.error(`Error streaming file: ${error.message}`);
      res.status(500).json({ error: 'Error streaming file' });
    }
  })
);
// Route for downloading files
router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const fileId = req.params.id;

    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads',
      });

      const file = await bucket.find({ _id: mongoose.Types.ObjectId(fileId) }).toArray();

      if (!file || file.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.set({
        'Content-Type': file[0].contentType,
        'Content-Disposition': `attachment; filename="${file[0].filename}"`,
      });

      const downloadStream = bucket.openDownloadStream(mongoose.Types.ObjectId(fileId));

      downloadStream.on('error', err => {
        return res.status(500).json({ error: `Error downloading file: ${err.message}` });
      });

      downloadStream.pipe(res);
    } catch (error) {
      logger.error(`Error downloading file: ${error.message}`);
      res.status(500).json({ error: 'Error downloading file' });
    }
  })
);

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
