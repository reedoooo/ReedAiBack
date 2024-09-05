const fs = require('fs');
const path = require('path');

const openAiApiFileService = openai => ({
  uploadFile: async filePath => {
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'fine-tune',
    });
    console.log(file);
    return file.id;
  },
  listFiles: async () => {
    const list = await openai.files.list();
    for await (const file of list) {
      console.log(file);
    }
    return files.data;
  },
  deleteFile: async fileId => {
    const response = await openai.files.del(fileId);
    console.log(response);
    return response;
  },
  retrieveFile: async fileId => {
    const file = await openai.files.retrieve(fileId);
    return file;
  },
  retrieveFileContent: async fileId => {
    const file = await openai.files.content(fileId);
    return file;
  },
});

module.exports = {
  openAiApiFileService,
};
