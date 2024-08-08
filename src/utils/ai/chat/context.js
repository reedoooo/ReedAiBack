async function analyzeTextWithGPT(text) {
  try {
    const response = await openai.Completion.create({
      model: 'gpt-3.5-turbo', // Use GPT-3.5-turbo model
      prompt: `You are a PI,Extract relevant information about the following content:\n\n${text}`,
      max_tokens: 200, // Adjust as needed
    });
    return response.choices[0].text.trim();
  } catch (error) {
    console.error('Error analyzing text with GPT:', error);
    return `Could not analyze content.`;
  }
}

async function analyzeImage(imageUrl) {
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
}

const summarizeMessages = async (messages, openai) => {
  const summarizeFunction = {
    name: 'summarize_messages',
    description: 'Summarize a list of chat messages',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'A concise summary of the chat messages',
        },
      },
      required: ['summary'],
    },
  };

  const response = await openai.completionWithRetry({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that summarizes chat messages.' },
      {
        role: 'user',
        content: `Summarize these messages. Give an overview of each message: ${JSON.stringify(messages)}`,
      },
    ],
    functions: [summarizeFunction],
    function_call: { name: 'summarize_messages' },
  });

  const functionCall = response.choices[0].message.function_call;
  if (functionCall && functionCall.name === 'summarize_messages') {
    return JSON.parse(functionCall.arguments).summary;
  }
  return 'Unable to generate summary';
};

module.exports = {
	summarizeMessages,
	analyzeTextWithGPT,
  analyzeImage,
};
