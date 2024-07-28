const ChatFile = mongoose.model('ChatFile', chatFileSchema);

// ChatFileHandler
class ChatFileHandler {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post('/upload', upload.single('file'), this.receiveFile.bind(this));
    this.router.get('/chat_file/:uuid/list', this.chatFilesBySessionUUID.bind(this));
    this.router.get('/download/:id', this.downloadFile.bind(this));
    this.router.delete('/download/:id', this.deleteFile.bind(this));
  }

  async receiveFile(req, res) {
    try {
      const sessionUUID = req.body['session-uuid'];
      const userId = req.user.id; // Assuming user authentication middleware

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const chatFile = new ChatFile({
        chatSessionId: sessionUUID,
        userId: userId,
        name: file.originalname,
        data: fs.readFileSync(file.path),
        mimeType: file.mimetype,
      });

      await chatFile.save();

      fs.unlinkSync(file.path); // Remove temp file

      res.status(200).json({ url: `/download/${chatFile._id}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async downloadFile(req, res) {
    try {
      const file = await ChatFile.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.set({
        'Content-Disposition': `attachment; filename=${file.name}`,
        'Content-Type': 'application/octet-stream',
      });

      res.send(file.data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteFile(req, res) {
    try {
      await ChatFile.findByIdAndDelete(req.params.id);
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async chatFilesBySessionUUID(req, res) {
    try {
      const sessionUUID = req.params.uuid;
      const userId = req.user.id; // Assuming user authentication middleware

      const chatFiles = await ChatFile.find({ chatSessionId: sessionUUID, userId: userId });

      if (chatFiles.length === 0) {
        return res.status(200).json([]);
      }

      res.status(200).json(
        chatFiles.map(file => ({
          id: file._id,
          name: file.name,
          mimeType: file.mimeType,
          createdAt: file.createdAt,
        }))
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ChatFileHandler;
