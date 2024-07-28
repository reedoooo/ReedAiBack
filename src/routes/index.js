// routes/index.js
const userRoutes = require('./user');
const chatRoutes = require('./chat');
const fileRoutes = require('./files/index.jsx');

const setupRoutes = app => {
  // MAIN API ROUTES
  app.use('/api/user', userRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/files', fileRoutes);
  // Endpoint to serve images from static files
  app.get('/static/files/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../public/static/files', filename);

    // Check if the file exists
    fs.exists(filePath, exists => {
      if (!exists) {
        return res.status(404).send('File not found');
      }

      // Send the file
      res.sendFile(filePath);
    });
  });
};

module.exports = setupRoutes;
