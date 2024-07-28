const { fileService } = require('./service');

exports.getFiles = async (req, res) => {
  try {
    const files = await fileService.getFiles(req.query.workspace_id);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createFile = async (req, res) => {
  try {
    const file = await fileService.createFile(req.body);
    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFile = async (req, res) => {
  try {
    const file = await fileService.updateFile(req.params.id, req.body);
    res.json(file);
  } catch (error) {
    if (error.message === 'File not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const result = await fileService.deleteFile(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message === 'File not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};
