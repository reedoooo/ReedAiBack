// String Manipulation, Parsing, and Extraction Utilities
function replaceUnsupportedCharacters(text) {
  const replacements = {
    '●': '*',
  };
  return text.replace(/[\u2022]/g, (char) => replacements[char] || char);
}

function replacePlaceholders(text, placeholders) {
  return text.replace(/\[.*?\]/g, (match) => placeholders[match] || match);
}

const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

function isString(test) {
  return typeof test === 'string';
}

const extractFirstCodeBlock = (input) => {
  const pattern = /```(\w+)?\n([\s\S]+?)\n```/g;
  let matches;
  while ((matches = pattern.exec(input)) !== null) {
    const language = matches[1];
    const codeBlock = matches[2];
    if (language === undefined || language === 'tsx' || language === 'json') {
      return codeBlock;
    }
  }
  throw new Error('No code block found in input');
};

const axios = require('axios');
const cheerio = require('cheerio');
const { logger } = require('@/config/logging/index');

async function extractTextFromUrl(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const text = [];
    $('div.description__text').each((index, element) => {
      text.push($(element).text().trim());
    });

    const lines = text.map((line) => line.trim()).filter((line) => line);
    const document = splitTextDocuments(lines.join('\n'));
    return document;
  } catch (error) {
    logger.error('Error extracting text from URL:', error);
    throw error;
  }
}

function splitTextDocuments(text) {
  const documents = text.split(/\n\s*\n/);
  return documents.map((doc) => doc.trim());
}

function convertDraftContentStateToPlainText(draftContentState) {
  if (!draftContentState.blocks) {
    logger.error('Invalid draft content state: Missing blocks');
    return '';
  }
  return draftContentState.blocks.map((block) => block.text).join('\n');
}

function convertToRegularObject(inputArray) {
  if (!Array.isArray(inputArray)) {
    throw new TypeError(`EXPECTED INPUT TO BE AN ARRAY, GOT ${typeof inputArray} of ${inputArray}`);
  }
  return inputArray.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

function cleanJSONString(str) {
  return str.replace(/```json\s*([\s\S]*?)\s*```/, '$1').trim();
}

module.exports = {
  replaceUnsupportedCharacters,
  replacePlaceholders,
  escapeRegExp,
  isString,
  extractFirstCodeBlock,
  extractTextFromUrl,
  splitTextDocuments,
  convertDraftContentStateToPlainText,
  convertToRegularObject,
  cleanJSONString,
};
