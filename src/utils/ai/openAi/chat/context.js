const { logger } = require('@/config/logging');
const { getEnv } = require('@/utils/api');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { OpenAI } = require('@langchain/openai');
const { default: axios } = require('axios');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
/**
 * Function to dynamically generate a React component based on a detailed prompt.
 * @param {string} prompt - Detailed description of the component to be generated.
 * @param {string} apiKey - The API key for the AI model service.
 * @returns {Promise<string>} - A promise that resolves to the generated React component code.
 */
// async function generateReactComponent(prompt, apiKey) {
//   try {
//     const response = await fetch('https://api.openai.com/v1/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         model: 'text-davinci-003',
//         prompt: prompt,
//         max_tokens: 1500,
//         temperature: 0.7,
//       }),
//     });

//     const data = await response.json();
//     return data.choices[0].text.trim();
//   } catch (error) {
//     logger.error('Error generating React component:', error);
//     throw new Error('Error generating React component');
//   }
// }
// /**
//  * Function to enhance an existing styled component with additional features or best practices.
//  * @param {string} componentCode - The existing component code to be enhanced.
//  * @param {string} enhancementPrompt - Description of the enhancements to be applied.
//  * @param {string} apiKey - The API key for the AI model service.
//  * @returns {Promise<string>} - A promise that resolves to the enhanced component code.
//  */
// async function enhanceStyledComponent(componentCode, enhancementPrompt, apiKey) {
//   try {
//     const combinedPrompt = `
//         Here is a styled component:
//         ${componentCode}

//         Please enhance it with the following features or best practices:
//         ${enhancementPrompt}
//         `;

//     const response = await fetch('https://api.openai.com/v1/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         model: 'text-davinci-003',
//         prompt: combinedPrompt,
//         max_tokens: 1500,
//         temperature: 0.7,
//       }),
//     });

//     const data = await response.json();
//     return data.choices[0].text.trim();
//   } catch (error) {
//     logger.error('Error enhancing styled component:', error);
//     throw new Error('Error enhancing styled component');
//   }
// }
// /**
//  * Function to process a PDF, extract images, and ask a question to an AI model.
//  * @param {string} pdfPath - The file path to the PDF document.
//  * @param {string} question - The question to be asked for each image in the PDF.
//  * @param {string} apiKey - The API key for the AI model service.
//  * @returns {Promise<Array>} - A promise that resolves to an array of responses from the AI model.
//  */
// async function processPdfAndAskQuestion(pdfPath, question, apiKey) {
//   try {
//     // Extract images from the PDF
//     const existingPdfBytes = fs.readFileSync(pdfPath);
//     const pdfDoc = await PDFDocument.load(existingPdfBytes);
//     const pages = pdfDoc.getPages();
//     const images = [];

//     for (const page of pages) {
//       const { width, height } = page.getSize();
//       const imageBytes = await page.render({ scale: 2 }).toBuffer();
//       const image = await sharp(imageBytes).resize({ width, height }).toBuffer();
//       images.push(image);
//     }
//     const openai = new OpenAI({ apiKey });
//     // Ask the question to the AI model for each image
//     const results = [];
//     for (const image of images) {
//       const response = await openai.completionWithRetry({
//         model: 'gpt-4-1106-preview', // Use GPT-3.5-turbo model
//         prompt: question,
//         // prompt: `You are a detective analyzing a crime scene. What can you infer from the following image?\n\n${question}`,
//         max_tokens: 200, // Adjust as needed
//         images: [image.toString('base64')],
//       });

//       // const response = await fetch('https://api.openai.com/v1/images/generate', {
//       //   method: 'POST',
//       //   headers: {
//       //     'Content-Type': 'application/json',
//       //     Authorization: `Bearer ${apiKey}`,
//       //   },
//       //   body: JSON.stringify({
//       //     prompt: question,
//       //     n: 1,
//       //     size: '1024x1024',
//       //     response_format: 'url',
//       //     image: image.toString('base64'),
//       //   }),
//       // });
//       const data = await response.json();
//       results.push(data);
//     }

//     return results;
//   } catch (error) {
//     logger.error('Error processing PDF:', error);
//     throw new Error('Error processing PDF');
//   }
// }
// /**
//  * Function to generate a React component that dynamically renders content based on provided data.
//  * @param {object} dataStructure - The data structure to be used for rendering the component.
//  * @param {string} apiKey - The API key for the AI model service.
//  * @returns {Promise<string>} - A promise that resolves to the generated React component code.
//  */
// async function generateDataDrivenComponent(dataStructure, apiKey) {
//   try {
//     const prompt = `
//         Given the following data structure:
//         ${JSON.stringify(dataStructure, null, 2)}

//         Generate a React component that dynamically renders this content with styled-components.
//         Ensure it is optimized for performance and responsiveness.
//         `;

//     const response = await fetch('https://api.openai.com/v1/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         model: 'text-davinci-003',
//         prompt: prompt,
//         max_tokens: 1500,
//         temperature: 0.7,
//       }),
//     });

//     const data = await response.json();
//     return data.choices[0].text.trim();
//   } catch (error) {
//     logger.error('Error generating data-driven component:', error);
//     throw new Error('Error generating data-driven component');
//   }
// }
// /**
//  * Function to generate Redux actions, reducers, and selectors for a given React component.
//  * @param {string} componentCode - The existing component code.
//  * @param {string} apiKey - The API key for the AI model service.
//  * @returns {Promise<string>} - A promise that resolves to the generated Redux code.
//  */
// async function integrateStateManagement(componentCode, apiKey) {
//   try {
//     const prompt = `
//         Given the following React component:
//         ${componentCode}

//         Generate Redux actions, reducers, and selectors for this component.
//         Ensure the state management follows best practices.
//         `;

//     const response = await fetch('https://api.openai.com/v1/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${apiKey}`,
//       },
//       body: JSON.stringify({
//         model: 'text-davinci-003',
//         prompt: prompt,
//         max_tokens: 1500,
//         temperature: 0.7,
//       }),
//     });

//     const data = await response.json();
//     return data.choices[0].text.trim();
//   } catch (error) {
//     logger.error('Error integrating state management:', error);
//     throw new Error('Error integrating state management');
//   }
// }
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
  try {
    const searchQuery = `${query}`;

    const response = await axios.get('https://api.perplexity.ai/search', {
      params: {
        q: searchQuery,
        num: numResults,
      },
      headers: {
        Authorization: getEnv('PERPLEXITY_API_KEY'),
        'Content-Type': 'application/json',
      },
    });

    // Extract and return the relevant documents
    const documents = response.data.results.map(result => ({
      pageContent: result.snippet,
      metadata: { url: result.url },
    }));

    return documents;
  } catch (error) {
    console.error('Error performing web search:', error);
    return [];
  }
}
async function performPerplexityCompletion(prompt, perplexityApiKey) {
  try {
      // Make a request to the Perplexity API
      const response = await axios.post('https://api.perplexity.ai/completions', {
          prompt: prompt,
          max_tokens: 150, // Adjust as needed
          temperature: 0.7, // Adjust as needed
          model: 'gpt-3.5-turbo' // Use the appropriate model
      }, {
          headers: {
              'Authorization': `Bearer ${perplexityApiKey}`,
              'Content-Type': 'application/json'
          }
      });

      // Extract and return the relevant completion
      const completion = response.data.choices[0].text.trim();
      return [{ pageContent: completion, metadata: { source: 'Perplexity AI' } }];
  } catch (error) {
      console.error('Error performing Perplexity completion:', error);
      return [];
  }
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
