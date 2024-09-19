const analyzeTextWithGPT = async text => {
  try {
    const response = await openai.Completion.create({
      model: 'gpt-3.5-turbo', // Use GPT-3.5-turbo model
      prompt: `You are a PI, Extract relevant information about the following content:\n\n${text}`,
      max_tokens: 200, // Adjust as needed
    });
    return response.choices[0].text.trim();
  } catch (error) {
    console.error('Error analyzing text with GPT:', error);
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
    console.error('Error analyzing image with GPT-4 Vision:', error);
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
    // const linkedInUrls = results.organic.filter(res => res.link.includes('linkedin.com'));
    // Scrape each LinkedIn URL
    for (const result of uiLinksArray) {
      // const scrapedData = await scrapeLinkedIn(result.link);
      const scrapedData = {
        scrapedContent: 'Not available', // Placeholder value
      };
      result['scrapedContent'] = scrapedData;
    }
    return results;
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
};
const summarizeMessages = async (messages, openai) => {
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
  const response = await openai.completionWithRetry({
    model: 'gpt-3.5-turbo',
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
const searchFiles = (query, directory) => {
  const results = [];
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.toLowerCase().includes(query.toLowerCase())) {
      results.push({ file, path: filePath });
    }
  }

  return results;
};

module.exports = {
  summarizeMessages,
  analyzeTextWithGPT,
  analyzeImage,
  fetchSearchResults,
  extractSummaries,
	searchFiles,
};
