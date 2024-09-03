const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');

class FileManager {
  constructor(basePath, dbUri) {
    this.basePath = basePath;
    this.client = new MongoClient(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = this.client.db('ragDatabase');
    this.filesCollection = this.db.collection('files');
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  async saveFile(category, fileName, content) {
    try {
      const categoryPath = path.join(this.basePath, category);
      await fs.mkdir(categoryPath, { recursive: true });
      const filePath = path.join(categoryPath, fileName);

      if (!this.validateFileName(fileName)) {
        throw new Error('Invalid file name');
      }

      await fs.writeFile(filePath, content);

      const metadata = {
        category: category,
        file_name: fileName,
        path: filePath,
        created_at: new Date().toISOString(),
      };

      await this.filesCollection.insertOne(metadata);
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

  async getFile(category, fileName) {
    try {
      const metadata = await this.filesCollection.findOne({ category: category, file_name: fileName });

      if (!metadata) {
        throw new Error('File not found');
      }

      const content = await fs.readFile(metadata.path, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error retrieving file:', error);
    }
  }

  async listFiles(category) {
    try {
      const files = await this.filesCollection.find({ category: category }).toArray();
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
    }
  }

  validateFileName(fileName) {
    return !/[\/\\:*?"<>|]/.test(fileName);
  }
}

// Usage
(async () => {
  const fileManager = new FileManager('/path/to/data', 'mongodb://localhost:27017');
  await fileManager.connect();

  // Example of saving a document
  await fileManager.saveFile('documents', 'article1.txt', 'Article content...');

  // Example of retrieving a document
  const content = await fileManager.getFile('documents', 'article1.txt');
  console.log(content);

  // Example of listing files in a category
  const documents = await fileManager.listFiles('documents');
  console.log(documents);
})();
