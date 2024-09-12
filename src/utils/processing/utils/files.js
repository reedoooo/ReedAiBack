const { logger } = require('@/config/logging');
const { File } = require('@/models');
const fs = require('fs');
const path = require('path');

const convertBlobToBase64 = async blob => {
  if (!blob) {
    throw new Error('No blob provided');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function getMediaTypeFromDataURL(dataURL) {
  const matches = dataURL.match(/^data:([A-Za-z-+\/]+);base64/);
  return matches ? matches[1] : null;
}

function getBase64FromDataURL(dataURL) {
  const matches = dataURL.match(/^data:[A-Za-z-+\/]+;base64,(.*)$/);
  return matches ? matches[1] : null;
}
const byteToImageURL = (mimeType, data) => {
  const b64 = `data:${mimeType};base64,${encode(data)}`;
  return b64;
};

const getFileExtension = filename => {
  const extension = filename.split('.').pop();
  return extension ? extension.toLowerCase() : '';
};

const saveFileToSystemAndDB = async ({ content, userId, workspaceId, folderId, library }) => {
  // Generate the file name with timestamp
  const fileName = `${library}_scraped_${Date.now()}.txt`;
  const filePath = path.join(__dirname, '../../../../public/uploads', fileName);

  try {
    // Write the scraped content to a file
    fs.writeFileSync(filePath, content, 'utf8');
    logger.info(`Content saved to ${filePath}`);

    // Get file stats
    const fileStats = fs.statSync(filePath);
    const fileType = path.extname(fileName).slice(1);

    // Create file metadata
    const fileMetadata = {
      userId,
      workspaceId,
      folderId,
      name: fileName,
      size: fileStats.size,
      originalFileType: fileType,
      filePath,
      type: fileType,
      metadata: {
        fileSize: fileStats.size,
        fileType: fileType,
        lastModified: fileStats.mtime,
      },
    };

    // Save file information to MongoDB
    const newFile = new File(fileMetadata);
    loggerf.info('Creating new file entry in MongoDB...');
    await newFile.save();
    logger.info('File information saved to MongoDB');

    // Return success response
    return {
      success: true,
      fileName,
      filePath,
      size: fileStats.size,
      type: fileType,
    };
  } catch (error) {
    logger.error('Error in saving file:', error.message);
    throw new Error('File handling error: ' + error.message);
  }
};

module.exports = {
  saveFileToSystemAndDB,
  convertBlobToBase64,
  getMediaTypeFromDataURL,
  getBase64FromDataURL,
  byteToImageURL,
  getFileExtension,
};
