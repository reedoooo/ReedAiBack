const axios = require('axios');
const cheerio = require('cheerio');

const scrapeContent = async (url) => {
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

module.exports = {
	scrapeContent,
};