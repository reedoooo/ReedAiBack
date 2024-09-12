const fs = require('fs').promises;
const path = require('path');

class FileManager {
  constructor(basePath, filesCollection) {
    this.basePath = basePath;
    this.filesCollection = filesCollection;
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
module.exports = { FileManager };
