const { logger } = require('@/config/logging');
const { getEnv } = require('@/utils/api');
const { default: axios } = require('axios');
const fs = require('fs');
const sharp = require('sharp');

const analyzeTextWithGPT = async text => {
  try {
    const response = await openai.Completion.create({
      model: 'gpt-3.5-turbo', // Use GPT-3.5-turbo model
      prompt: `You are a PI, Extract relevant information about the following content:\n\n${text}`,
      max_tokens: 200, // Adjust as needed
    });
    return response.choices[0].text.trim();
  } catch (error) {
    logger.error('Error analyzing text with GPT:', error);
    return `Could not analyze content.`;
  }
};
const analyzeImage = async imageUrl => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview', // Ensure this is the correct model name
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What’s in this image?' },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl, // URL of the image to analyze
                detail: 'low', // Adjust the detail level as needed
              },
            },
          ],
        },
      ],
    });

    return response.choices[0].message.content; // Adjust according to the actual structure of the response
  } catch (error) {
    logger.error('Error analyzing image with GPT-4 Vision:', error);
    return `Could not analyze image: ${error.message}`;
  }
};
const fetchSearchResults = async query => {
  let data = JSON.stringify({
    q: query,
  });
  const config = {
    method: 'post',
    url: 'https://google.serper.dev/search',
    headers: {
      'X-API-KEY': process.env.GOOGLE_SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    data: data,
  };

  try {
    const response = await axios(config);
    const results = response.data;
    // Filter for LinkedIn URLs
    const frameworkDocs = {
      MUI: 'https://mui.com/components/',
      CHAKRA_UI: 'https://chakra-ui.com/docs/getting-started',
      REACT_BOOTSTRAP: 'https://react-bootstrap.github.io/',
      TAILWIND: 'https://tailwindcss.com/docs',
      RADIX_UI: 'https://www.radix-ui.com/primitives/docs',
      SHADCN: 'https://ui.shadcn.com/docs',
    };
    const uiLinksArray = Object.keys(frameworkDocs).map(key => ({ framework: key, url: frameworkDocs[key] }));
    const chatCodeContextSearch = results.organic.filter(res =>
      res.link.includes.oneOf(uiLinksArray.map(ui => ui.url))
    );
    for (const result of chatCodeContextSearch) {
      // const scrapedData = await scrapeLinkedIn(result.link);
      const scrapedData = {
        scrapedContent: 'Not available', // Placeholder value
      };
      result['scrapedContent'] = scrapedData;
    }
    return results;
  } catch (error) {
    logger.error(`Error: ${error}`);
    throw error;
  }
};
const summarizeMessages = async (messages, chatOpenAI) => {
  const summarizeFunction = {
    name: 'summarize_messages',
    description:
      'Summarize a list of chat messages with an overall summary and individual message summaries including their IDs',
    parameters: {
      type: 'object',
      properties: {
        overallSummary: {
          type: 'string',
          description: 'An overall summary of the chat messages',
        },
        individualSummaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The ID of the chat message',
              },
              summary: {
                type: 'string',
                description: 'A summary of the individual chat message',
              },
            },
            required: ['id', 'summary'],
          },
        },
      },
      required: ['overallSummary', 'individualSummaries'],
    },
  };
  const response = await chatOpenAI.completionWithRetry({
    model: 'gpt-4-1106-preview',
    // prompt: template,
    messages: [
      { role: 'system', content: 'You are a helpful assistant that summarizes chat messages.' },
      {
        role: 'user',
        content: `Summarize these messages. Provide an overall summary and a summary for each message with its corresponding ID: ${JSON.stringify(messages)}`,
      },
    ],
    functions: [summarizeFunction],
    function_call: { name: 'summarize_messages' },
  });
  const functionCall = response.choices[0].message.function_call;
  if (functionCall && functionCall.name === 'summarize_messages') {
    const { overallSummary, individualSummaries } = JSON.parse(functionCall.arguments);
    return {
      overallSummary,
      individualSummaries,
    };
  }
  return { overallSummary: 'Unable to generate summary', individualSummaries: [] };
};
const extractSummaries = summaryResponse => {
  const overallSummaryString = summaryResponse.overallSummary;
  const individualSummariesArray = summaryResponse.individualSummaries.map(summary => ({
    id: summary.id,
    summary: summary.summary,
  }));

  return {
    overallSummaryString,
    individualSummariesArray,
  };
};
async function performWebSearch(query, numResults) {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid query: Query must be a non-empty string');
  }

  if (!numResults || typeof numResults !== 'number' || numResults <= 0) {
    throw new Error('Invalid numResults: Must be a positive number');
  }

  const apiKey = getEnv('PERPLEXITY_API_KEY');
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not set in the environment');
  }

  try {
    const response = await axios.get('https://api.perplexity.ai/search', {
      params: { q: query, num: numResults },
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    if (!response.data || !Array.isArray(response.data.results)) {
      throw new Error('Invalid response format from Perplexity API');
    }

    return response.data.results.map(result => ({
      pageContent: result.snippet || '',
      metadata: { url: result.url || '' },
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`Perplexity API error: ${error.response.status} - ${error.response.data}`);
        throw new Error(`Perplexity API error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received from Perplexity API');
        throw new Error('No response received from Perplexity API');
      } else {
        console.error('Error setting up the request:', error.message);
        throw new Error('Error setting up the request to Perplexity API');
      }
    } else {
      console.error('Unexpected error during web search:', error);
      throw new Error('Unexpected error during web search');
    }
  }
}
async function performPerplexityCompletion(prompt, perplexityApiKey) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt: Prompt must be a non-empty string');
  }
  if (!perplexityApiKey || typeof perplexityApiKey !== 'string') {
    throw new Error('Invalid API key: API key must be a non-empty string');
  }
  try {
    const data = {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: 'Be precise and concise.' },
        { role: 'user', content: prompt },
      ],
      return_citations: true,
      search_domain_filter: ['perplexity.ai'],
      return_images: false,
      search_recency_filter: 'month',
      stream: false,
      max_tokens: 150,
      temperature: 0.5,
    };
    const config = {
      method: 'post',
      url: 'https://api.perplexity.ai/chat/completions',
      headers: {
        Authorization: `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      data: data,
    };
    logger.info(`Perplexity completion: ${prompt}`);
    // Perform the API request
    const response = await axios(config);
    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response format from Perplexity API');
    }

    const completion = response.data.choices[0].message.content.trim(); // Adjusted to access the correct property
    const citations = response.data.choices[0].message.citations || [];
    logger.info(`Perplexity completion response: ${completion} - Citations: ${citations.length}`);
    // return [{ pageContent: completion, metadata: { source: 'Perplexity AI', citations } }];
    const formattedResponse = formatResponseWithCitations(completion, citations);

    return formattedResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`Perplexity API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        throw new Error(`Perplexity API error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received from Perplexity API');
        throw new Error('No response received from Perplexity API');
      } else {
        console.error('Error setting up the request:', error.message);
        throw new Error('Error setting up the request to Perplexity API');
      }
    } else {
      console.error('Unexpected error during Perplexity completion:', error);
      throw new Error('Unexpected error during Perplexity completion');
    }
  }
}
function formatResponseWithCitations(content, citations) {
  let markdownContent = content;
  const references = [];

  citations.forEach((citation, index) => {
    const citationKey = `[@Ref${index + 1}]`;
    markdownContent = markdownContent.replace(citation.text, `${citation.text} ${citationKey}`);
    references.push(`${citationKey}: ${citation.metadata.title}. ${citation.metadata.url}`);
  });

  if (references.length > 0) {
    markdownContent += "\n\n## References\n" + references.join("\n");
  }

  return { pageContent: markdownContent, metadata: { type: "markdown", references } };
}
module.exports = {
  summarizeMessages,
  analyzeTextWithGPT,
  analyzeImage,
  fetchSearchResults,
  extractSummaries,
  performWebSearch,
  performPerplexityCompletion,
  // analyzeTextWithGPT,
  // analyzeImage,
  // fetchSearchResults,
  // extractSummaries,
};
// const template = new ChatPromptTemplate([
//   { role: 'system', content: 'You are a helpful assistant that summarizes chat messages.' },
//   {
//     role: 'user',
//     content: `Summarize these messages. Provide an overall summary and a summary for each message with its corresponding ID: ${JSON.stringify(messages)}`,
//   },
// ]);
// const input = [
//   SystemMessage( 'You are a helpful assistant that summarizes chat messages.' ),
//   HumanMessage( `Summarize these messages. Provide an overall summary and a summary for each message with its corresponding ID: ${JSON.stringify(messages)}` ),
// ];
// const response = await chatOpenAI.completionWithRetry({
//   model: 'gpt-4-1106-preview',
// messages: [
//   { role: 'system', content: 'You are a helpful assistant that summarizes chat messages.' },
//   {
//     role: 'user',
//     content: `Summarize these messages. Provide an overall summary and a summary for each message with its corresponding ID: ${JSON.stringify(messages)}`,
//   },
// ],
//   functions: [summarizeFunction],
//   function_call: { name: 'summarize_messages' },
// });
