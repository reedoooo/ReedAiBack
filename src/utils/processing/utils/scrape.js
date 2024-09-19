const axios = require('axios');
const cheerio = require('cheerio');

const scrapeContent = async url => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const content = $('body').text(); // Simplified for demonstration
    return content;
  } catch (error) {
    console.error('Error scraping content:', error);
    throw error;
  }
};
async function factCheckAgainstDocs(generatedAnswer, library = 'react') {
  const docsUrl = `https://reactjs.org/docs/getting-started.html`; // Example URL
  const response = await axios.get(docsUrl);
  const $ = cheerio.load(response.data);

  const docContent = $('main').text();
  const statements = generatedAnswer.split('.');

  const checkedStatements = statements.map(statement => {
    if (docContent.includes(statement.trim())) {
      return `${statement} [Verified]`;
    }
    return statement;
  });

  return checkedStatements.join('. ');
}

module.exports = {
  scrapeContent,
  factCheckAgainstDocs,
};
