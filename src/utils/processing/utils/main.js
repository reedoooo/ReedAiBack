
const { processCSV } = require('../../processing/types/csv.js');
const { processDocX } = require('../../processing/types/docx.js');
const { processJSON } = require('../../processing/types/json.js');
const { processPdf } = require('../../processing/types/pdf.js');
const { processTxt } = require('../../processing/types/txt.js');

const processDocument = async doc => {
  const extension = doc.metadata.source.split('.').pop().toLowerCase();
  switch (extension) {
    case 'csv':
      return processCSV(doc.pageContent);
    case 'docx':
      return processDocX(doc.pageContent);
    case 'json':
      return processJSON(doc.pageContent);
    case 'md':
      return processMarkdown(doc.pageContent);
    case 'pdf':
      return processPdf(doc.pageContent);
    case 'txt':
      return processTxt(doc.pageContent);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
};

module.exports = { processDocument };