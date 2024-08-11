const summarizeFunction = {
  type: 'function',
  function: {
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
  },
};
const fetchSearchResults = {
  type: 'function',
  function: {
    name: 'fetchSearchResults',
    description: 'Fetch search results for a given query using SERP API used to aid in being  PRIVATE INVESTIGATOR',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Query string to search for',
        },
      },
      required: ['query'],
    },
  },
};
const codeInterpreter = {
  type: 'code_interpreter',
  // Details about the code interpreter tool
};
const fileSearch = {
  type: 'retrieval',
  // Details about the retrieval tool
};
const analyzeImage = {
  type: 'function',
  function: {
    name: 'analyzeImage',
    description: "Analyze the content of an image using OpenAI's Vision API",
    parameters: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to analyze',
        },
      },
      required: ['imageUrl'],
    },
    // Function logic or reference here (e.g., analyzeImageWithVisionAPI)
  },
};

const tools = [
  summarizeFunction,
  fetchSearchResults,
  codeInterpreter,
  fileSearch,
  analyzeImage,
  // Additional tools can be added here
];
const toolPrompts = {
  SUMMARIZE_MESSAGES: JSON.stringify(summarizeFunction),
  FETCH_SEARCH_RESULTS: JSON.stringify(fetchSearchResults),
  ANALYZE_IMAGE: JSON.stringify(analyzeImage),
  FILE_SEARCH: JSON.stringify(fileSearch),
  CODE_INTERPRETER: JSON.stringify(codeInterpreter),
};

module.exports = {
  tools,
  toolPrompts,
};
