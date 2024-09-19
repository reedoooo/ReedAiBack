const Sitemapper = require('sitemapper');
const cheerio = require('cheerio');
const { PineconeClient } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new PineconeClient();

const uiLibraries = [
  { name: 'React', sitemap: 'https://reactjs.org/sitemap.xml' },
  { name: 'Vue', sitemap: 'https://vuejs.org/sitemap.xml' },
  { name: 'Angular', sitemap: 'https://angular.io/generated/sitemap.xml' },
  { name: 'Svelte', sitemap: 'https://svelte.dev/sitemap.xml' },
  { name: 'Tailwind CSS', sitemap: 'https://tailwindcss.com/sitemap.xml' },
  { name: 'Material-UI', sitemap: 'https://mui.com/sitemap.xml' },
  { name: 'Radix UI', sitemap: 'https://www.radix-ui.com/sitemap.xml' },
  { name: 'Chakra UI', sitemap: 'https://chakra-ui.com/sitemap.xml' },
  { name: 'Ant Design', sitemap: 'https://ant.design/sitemap.xml' },
  { name: 'Bootstrap', sitemap: 'https://getbootstrap.com/sitemap.xml' },
  { name: 'Semantic UI', sitemap: 'https://semantic-ui.com/sitemap.xml' },
  { name: 'Bulma', sitemap: 'https://bulma.io/sitemap.xml' },
  { name: 'Foundation', sitemap: 'https://get.foundation/sitemap.xml' },
];

function extractText(htmlContent) {
  const $ = cheerio.load(htmlContent);
  $('style').remove();
  $('script').remove();
  $('[style]').removeAttr('style');
  return $('body').text().trim();
}

async function fetchTextContent(url) {
  const response = await fetch(url);
  const htmlContent = await response.text();
  return extractText(htmlContent);
}

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

async function upsertToPinecone(index, vectors) {
  await index.upsert({ vectors });
}

async function scrapeAndUpsertLibrary(library, index) {
  const sitemap = new Sitemapper({ url: library.sitemap });
  const { sites } = await sitemap.fetch();

  for (const site of sites) {
    console.log(`Scraping: ${site}`);
    const textContent = await fetchTextContent(site);

    // Split content into chunks of roughly 1000 characters
    const chunks = textContent.match(/[\s\S]{1,1000}/g) || [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await getEmbedding(chunk);

      const vector = {
        id: `${library.name}-${site}-${i}`,
        values: embedding,
        metadata: {
          library: library.name,
          url: site,
          chunk: i,
        },
      };

      await upsertToPinecone(index, [vector]);
    }
  }
}

function selectComponent(query, retrievedDocs) {
  const componentScores = Object.keys(uiLibraries).map(library => {
    const score = calculateRelevanceScore(query, library, retrievedDocs);
    return { library, score };
  });

  return componentScores.sort((a, b) => b.score - a.score)[0].library;
}

function calculateRelevanceScore(query, library, retrievedDocs) {
  // Implement a scoring mechanism based on query keywords, retrieved docs, and library features
  // Return a relevance score
}

async function main() {
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });

  const indexName = 'ui-libraries';
  const index = pinecone.Index(indexName);

  for (const library of uiLibraries) {
    console.log(`Processing ${library.name}...`);
    await scrapeAndUpsertLibrary(library, index);
  }

  console.log('All libraries processed and upserted to Pinecone.');
}

main().catch(console.error);
