const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { logger } = require('@/config/logging');
const { getEnv } = require('@/utils/api');
const { Workspace, Folder, User } = require('@/models');

// Declare global variables for GridFS and GridFSBucket
let gfs;
let bucket;

/**
 * Establishes a connection to MongoDB and initializes GridFS.
 * @async
 * @function connectDB
 * @throws {Error} If connection fails
 */
const connectDB = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const connectionString = process.env.MONGODB_URI || getEnv('MONGODB_URI');

    // Connect to MongoDB
    await mongoose.connect(connectionString);
    logger.info(`MongoDB connected successfully`);

    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });
    gfs = bucket;
    logger.info('GridFS bucket initialized successfully');
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

/**
 * Configures GridFS storage for file uploads.
 * @constant
 * @type {GridFsStorage}
 */
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI || getEnv('MONGODB_URI'),
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          logger.error(`Error generating filename: ${err.message}`);
          return reject(err);
        }
        const filename = `${buf.toString('hex')}${path.extname(file.originalname)}`;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          metadata: {
            originalName: file.originalname,
            uploadDate: new Date(),
            workspaceId: req.body.workspaceId,
            userId: req.body.userId,
            folderId: req.body.folderId,
            space: req.body.space,
          },
        };
        resolve(fileInfo);
      });
    });
  },
});

storage.on('connection', db => {
  logger.info('GridFsStorage connected to database');
});

storage.on('connectionFailed', err => {
  logger.error(`GridFsStorage connection failed: ${err.message}`);
});

storage.on('file', file => {
  logger.info(`File saved to GridFS: ${JSON.stringify(file)}`);
});

storage.on('streamError', (error, conf) => {
  logger.error(`Error in GridFS stream: ${error.message}`);
});

const generalStorageFunction = async (fileData, options) => {
  return new Promise((resolve, reject) => {
    const writestream = bucket.openUploadStream(options.filename, {
      contentType: options.mimeType,
      metadata: options.metadata,
    });

    writestream.write(fileData);
    writestream.end();

    writestream.on('finish', async function (gridFsFile) {
      try {
        // Create a new File document
        const newFile = new File({
          userId: options.metadata.userId,
          workspaceId: options.metadata.workspaceId,
          folderId: options.metadata.folderId,
          name: options.metadata.originalName,
          size: Buffer.byteLength(fileData),
          filePath: `/uploads/${gridFsFile._id}`,
          type: path.extname(options.filename).slice(1),
          mimeType: options.mimeType,
          space: options.metadata.space,
          gridFsId: gridFsFile._id,
        });

        await newFile.save();

        // Update related documents
        await updateRelatedDocuments(newFile);

        resolve({
          mongoDocument: newFile,
          gridFsFile: {
            _id: gridFsFile._id,
            filename: gridFsFile.filename,
          },
        });
      } catch (error) {
        logger.error(`Error saving file document: ${error.message}`);
        reject(error);
      }
    });

    writestream.on('error', function (error) {
      logger.error(`Error in GridFS stream: ${error.message}`);
      reject(error);
    });
  });
};

const updateRelatedDocuments = async file => {
  try {
    // Update Workspace
    await mongoose
      .model('Workspace')
      .findByIdAndUpdate(file.workspaceId, { $push: { files: file._id } }, { new: true, useFindAndModify: false });

    // Update Folder
    await mongoose
      .model('Folder')
      .findByIdAndUpdate(file.folderId, { $push: { files: file._id } }, { new: true, useFindAndModify: false });

    // Update User
    await mongoose
      .model('User')
      .findByIdAndUpdate(file.userId, { $push: { files: file._id } }, { new: true, useFindAndModify: false });

    logger.info(`File ${file._id} association process completed`);
  } catch (error) {
    logger.error(`Error associating file: ${error.message}`);
    throw error;
  }
};

/**
 * Filters files based on allowed types.
 * @function fileFilter
 * @param {Object} req - Express request object
 * @param {Object} file - File object
 * @param {function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only txt, pdf, doc, and docx are allowed.'));
  }
};

/**
 * Configures multer for file uploads.
 * @constant
 * @type {Object}
 */
const upload = multer({
  storage,
  // fileFilter,
  // limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
/**
 * Handles errors during file upload.
 * @function handleUploadError
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Next middleware function
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error(`Multer error: ${err.message}`);
    return res.status(400).json({ error: err.message });
  } else if (err) {
    logger.error(`Upload error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
  next();
};

/**
 * Gets the MongoDB connection, connecting if necessary.
 * @async
 * @function getDB
 * @returns {Object} Mongoose connection object
 */
const getDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  return mongoose.connection;
};
const getGFS = () => {
  if (!gfs) {
    throw new Error('GridFS has not been initialized. Please connect to the database first.');
  }
  return gfs;
};
const getBucket = () => {
  if (!bucket) {
    throw new Error('GridFS bucket has not been initialized. Please connect to the database first.');
  }
  return bucket;
};
const getStorage = () => {
  return storage;
};

/**
 * Closes the MongoDB connection.
 * @async
 * @function disconnectDB
 * @throws {Error} If disconnection fails
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

/**
 * Streams a file from GridFS to the response.
 * @function streamFile
 * @param {string} filename - Name of the file to stream
 * @param {Object} res - Express response object
 */
const streamFile = (filename, res) => {
  const readstream = bucket.openDownloadStreamByName(filename);
  readstream.on('error', err => {
    logger.error(`Error streaming file: ${err.message}`);
    res.status(404).json({ error: 'File not found' });
  });
  readstream.pipe(res);
};

/**
 * Deletes a file from GridFS.
 * @async
 * @function deleteFile
 * @param {string} filename - Name of the file to delete
 * @throws {Error} If file is not found or deletion fails
 */
const deleteFile = async filename => {
  try {
    const file = await gfs.files.findOne({ filename });
    if (!file) {
      throw new Error('File not found');
    }
    await bucket.delete(file._id);
    logger.info(`File deleted: ${filename}`);
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectDB,
  getDB,
  getGFS,
  getBucket,
  disconnectDB,
  upload,
  handleUploadError,
  streamFile,
  deleteFile,
  getStorage,
  generalStorageFunction,
  updateRelatedDocuments,
  fileFilter,
};

