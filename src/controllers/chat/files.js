const { File } = require('@/models');
const fs = require('fs');
const path = require('path');

const getAllFiles = async (req, res) => {
  try {
    const files = await File.find();
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
};

const getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.status(200).json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching file', error: error.message });
  }
};

const createFile = async (req, res) => {
  try {
    const newFile = new File(req.body);
    const savedFile = await newFile.save();
    res.status(201).json(savedFile);
  } catch (error) {
    res.status(400).json({ message: 'Error creating file', error: error.message });
  }
};

const updateFile = async (req, res) => {
  try {
    const updatedFile = await File.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedFile) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.status(200).json(updatedFile);
  } catch (error) {
    res.status(400).json({ message: 'Error updating file', error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const deletedFile = await File.findByIdAndDelete(req.params.id);
    if (!deletedFile) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const filePath = path.join(__dirname, '../../public/static/files', file.filename);
    res.download(filePath, file.originalname);
  } catch (error) {
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
};

const uploadSingleFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  try {
    const newFile = new File({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: req.file.path,
      size: req.file.size,
    });
    const savedFile = await newFile.save();
    res.status(201).json(savedFile);
  } catch (error) {
    res.status(400).json({ message: 'Error uploading file', error: error.message });
  }
};

const uploadMultipleFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }
  try {
    const savedFiles = await Promise.all(
      req.files.map(async file => {
        const newFile = new File({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path,
          size: file.size,
        });
        return await newFile.save();
      })
    );
    res.status(201).json(savedFiles);
  } catch (error) {
    res.status(400).json({ message: 'Error uploading files', error: error.message });
  }
};

const handleMultiTypeUpload = async (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: 'No files uploaded.' });
  }
  try {
    const savedFiles = {};
    for (const [fieldname, files] of Object.entries(req.files)) {
      savedFiles[fieldname] = await Promise.all(
        files.map(async file => {
          const newFile = new File({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path,
            size: file.size,
          });
          return await newFile.save();
        })
      );
    }
    res.status(201).json(savedFiles);
  } catch (error) {
    res.status(400).json({ message: 'Error handling multi-type upload', error: error.message });
  }
};

module.exports = {
  getAllFiles,
  getFileById,
  createFile,
  updateFile,
  deleteFile,
  downloadFile,
  uploadSingleFile,
  uploadMultipleFiles,
  handleMultiTypeUpload,
};
