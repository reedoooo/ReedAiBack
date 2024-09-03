const fs = require('fs');
const path = require('path');
const baseUrl = 'http://localhost:3001/static/';

const getListFiles = (req, res) => {
  const directoryPath = path.join(__dirname, '@/public/static');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan files:', err);
      return res.status(500).send({
        message: 'Unable to scan files!',
      });
    }

    if (!files || files.length === 0) {
      return res.status(200).send([]);
    }

    const fileInfos = files.map(file => ({
      name: file,
      url: baseUrl + file,
      type: path.extname(file).slice(1),
      data: fs.readFileSync(path.join(directoryPath, file), 'utf8'),
    }));

    res.status(200).send(fileInfos);
  });
};

const download = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = path.join(__dirname, '@/public/static');

  res.download(directoryPath + '/' + fileName, fileName, err => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};

// Upload a file
const uploadFile = async (req, res) => {
  const file = req.file;
  const { user_id, file_id } = req.body;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    const filePath = `${user_id}/${Buffer.from(file_id).toString('base64')}`;

    fs.rename(file.path, path.join('uploads', filePath), err => {
      if (err) {
        throw new Error('Error moving file');
      }
    });

    res.status(200).send({ filePath });
  } catch (error) {
    res.status(500).send('Error uploading file: ' + error.message);
  }
};

// Delete a file
const deleteFile = async (req, res) => {
  const { filePath } = req.params;

  try {
    fs.unlink(path.join('uploads', filePath), err => {
      if (err) {
        return res.status(500).send('Failed to remove file');
      }
      res.status(200).send('File removed successfully');
    });
  } catch (error) {
    res.status(500).send('Error deleting file: ' + error.message);
  }
};

// Get a file
const getFile = async (req, res) => {
  const { filePath } = req.params;

  try {
    const fullPath = path.join('uploads', filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
    }

    res.sendFile(path.resolve(fullPath));
  } catch (error) {
    res.status(500).send('Error retrieving file: ' + error.message);
  }
};

const getDownloads = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '@/public/downloads', filename);

  res.download(filePath, err => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
};

const downloadCustomPrompts = (req, res) => {
  const filePath = path.join(__dirname, '@/public/static', 'chatgpt-prompts-custom.json');
  res.download(filePath, 'chatgpt-prompts-custom.json', err => {
    if (err) {
      console.error(err);
      res.status(500).end();
    }
  });
};

const getFileByType = (req, res) => {
  const { type } = req.params;
  const directoryPath = path.join(__dirname, '@/public/static');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Unable to scan files:', err);
      return res.status(500).send({
        message: 'Unable to scan files!',
      });
    }

    if (!files || files.length === 0) {
      return res.status(200).send([]);
    }

    const filteredFiles = files.filter(file => path.extname(file).slice(1) === type);
    const fileInfos = filteredFiles.map(file => ({
      name: file,
      url: baseUrl + file,
      type: path.extname(file).slice(1),
      data: fs.readFileSync(path.join(directoryPath, file), 'utf8'),
    }));

    res.status(200).send(fileInfos);
  });
};

// Endpoint to get all JSON files from the static directory
const getAllStaticJsonFiles = (req, res) => {
  const staticDir = path.join(__dirname, '@/public/static');

  fs.readdir(staticDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const jsonFiles = files.filter(file => file.endsWith('.json'));
    res.json(jsonFiles);
  });
};

// Add custom prompt
const addCustomPrompt = (req, res) => {
  const { name, content } = req.body;
  const filePath = path.join(__dirname, '@/public', 'user-custom-prompts.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Internal Server Error');
    }

    let prompts = [];
    try {
      prompts = JSON.parse(data);
    } catch (err) {
      console.error('Error parsing JSON:', err);
    }

    prompts.push({ name, content });

    fs.writeFile(filePath, JSON.stringify(prompts, null, 2), 'utf8', err => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).send('Internal Server Error');
      }

      res.status(200).send('Prompt added successfully');
    });
  });
};

const getAllPngFiles = (req, res) => {
  const directoryPath = path.join(__dirname, '@/public/static');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).send('Internal Server Error');
    }

    const pngFiles = files.filter(file => file.endsWith('.png'));
    res.json(pngFiles);
  });
};

module.exports = {
  getListFiles,
  download,
  uploadFile,
  deleteFile,
  getFile,
  getDownloads,
  downloadCustomPrompts,
  getAllStaticJsonFiles,
  addCustomPrompt,
  getAllPngFiles,
  getFileByType,
};
