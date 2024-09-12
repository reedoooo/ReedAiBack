// controllers/chat-items/v2.js

const { pipeline } = require('stream/promises');
const { createReadStream } = require('fs');
const fs = require('fs');
const pdf = require('pdf-parse');
const { populateVectorStore } = require('@/utils/ai/pinecone/populate');
const mammoth = require('mammoth');
const { logger } = require('@/config/logging');
// Removed static require for @xenova/transformers

// Function to dynamically import the ESM module
async function loadTransformers() {
  const { Pipeline } = await import('@xenova/transformers');
  return { Pipeline };
}

const uploadFile = async (request, reply) => {
  try {
    const data = await request.file();

    if (!data) {
      throw new Error('No file uploaded');
    }

    const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(',');
    if (!allowedTypes.includes(data.mimetype)) {
      throw new Error('Invalid file type');
    }

    const jobData = {
      filepath: data.filepath,
      mimetype: data.mimetype,
      filename: data.filename,
    };

    await request.queue.add('processFile', jobData);

    return { message: 'File upload job added to the queue' };
  } catch (error) {
    logger.error('Error in file upload handler:', error);
    throw new Error('An error occurred while processing your file.');
  }
};

const processFile = async job => {
  const { filepath, mimetype, filename } = job.data;
  let content = '';

  try {
    switch (mimetype) {
      case 'application/pdf':
        const pdfBuffer = await fs.promises.readFile(filepath);
        const pdfData = await pdf(pdfBuffer);
        content = pdfData.text;
        break;
      case 'text/csv':
        const records = [];
        const parser = parse({
          delimiter: ',',
          columns: true,
          skip_empty_lines: true,
        });

        // Dynamically load the Pipeline from @xenova/transformers
        const { Pipeline } = await loadTransformers();

        await pipeline(createReadStream(filepath), parser, async function* (source) {
          for await (const record of source) {
            records.push(record);
          }
        });
        content = JSON.stringify(records);
        break;
      case 'text/plain':
        content = await fs.promises.readFile(filepath, 'utf-8');
        break;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        const workbook = xlsx.readFile(filepath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        content = JSON.stringify(xlsx.utils.sheet_to_json(sheet));
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const result = await mammoth.extractRawText({ path: filepath });
        content = result.value;
        break;
    }

    await populateVectorStore(content);
    logger.info(`File ${filename} processed and added to vector store`);
  } catch (error) {
    logger.error(`Error processing file ${filename}:`, error);
    throw error;
  } finally {
    // Clean up the temporary file
    await fs.promises.unlink(filepath);
  }
};

module.exports = {
  uploadFile,
  processFile,
};
