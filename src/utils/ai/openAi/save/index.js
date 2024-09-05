const buildPromptFromTemplate = async (summary, prompt) => {
  try {
    const tempObj = {
      input: `Please respond to the following prompt: ${prompt}`,
    };
    const promptTemplate = new PromptTemplate({
      template: tempObj.input,
      inputVariables: ['summary', 'prompt'],
    });
    return promptTemplate.format();
  } catch (error) {
    throw new Error(`Error building prompt from template: ${error.message}`);
  }
};
/**
 * Build the base prompt.
 * @param {string} prompt - The user prompt.
 * @param {string} profileContext - The user profile context.
 * @param {string} workspaceInstructions - The workspace instructions.
 * @param {Object | null} assistant - The assistant information.
 * @returns {string} The full prompt.
 */
function buildBasePrompt(prompt, profileContext, workspaceInstructions, assistant) {
  let fullPrompt = '';

  if (assistant) {
    fullPrompt += `<INJECT ROLE>\nYou are not an AI. You are ${assistant.name}.\n</INJECT ROLE>\n\n`;
  }

  fullPrompt += `Today is ${new Date().toLocaleDateString()}.\n\n`;

  if (profileContext) {
    fullPrompt += `User Info:\n${profileContext}\n\n`;
  }

  if (workspaceInstructions) {
    fullPrompt += `System Instructions:\n${workspaceInstructions}\n\n`;
  }

  fullPrompt += `User Instructions:\n${prompt}`;

  return fullPrompt;
}

/**
 * Build the final messages.
 *
 * @param {Object} payload - The chat payload.
 * @param {Object} profile - The user profile.
 * @param {Object[]} chatImages - The chat images.
 * @returns {Promise<Object[]>} The final messages.
 */
async function buildFinalMessages(payload, profile, chatImages) {
  const { chatSettings, workspaceInstructions, chatMessages, assistant, messageFileItems, chatFileItems } = payload;

  const BUILT_PROMPT = buildBasePrompt(
    chatSettings.prompt,
    chatSettings.includeProfileContext ? profile.profile_context || '' : '',
    chatSettings.includeWorkspaceInstructions ? workspaceInstructions : '',
    assistant
  );

  const CHUNK_SIZE = chatSettings.contextLength;
  const PROMPT_TOKENS = encode(chatSettings.prompt).length;

  let remainingTokens = CHUNK_SIZE - PROMPT_TOKENS;
  let usedTokens = PROMPT_TOKENS;

  const processedChatMessages = chatMessages.map((chatMessage, index) => {
    const nextChatMessage = chatMessages[index + 1];

    if (!nextChatMessage) {
      return chatMessage;
    }

    const nextChatMessageFileItems = nextChatMessage.fileItems;

    if (nextChatMessageFileItems.length > 0) {
      const findFileItems = nextChatMessageFileItems
        .map(fileItemId => chatFileItems.find(chatFileItem => chatFileItem.id === fileItemId))
        .filter(item => item !== undefined);

      const retrievalText = buildRetrievalText(findFileItems);

      return {
        message: {
          ...chatMessage.message,
          content: `${chatMessage.message.content}\n\n${retrievalText}`,
        },
        fileItems: [],
      };
    }

    return chatMessage;
  });

  let finalMessages = [];

  for (let i = processedChatMessages.length - 1; i >= 0; i--) {
    const message = processedChatMessages[i].message;
    const messageTokens = encode(message.content).length;

    if (messageTokens <= remainingTokens) {
      remainingTokens -= messageTokens;
      usedTokens += messageTokens;
      finalMessages.unshift(message);
    } else {
      break;
    }
  }

  let tempSystemMessage = {
    chat_id: '',
    assistant_id: null,
    content: BUILT_PROMPT,
    created_at: new Date().toISOString(),
    id: (processedChatMessages.length + 1).toString(),
    image_paths: [],
    model: payload.chatSettings.model,
    role: 'system',
    sequence_number: processedChatMessages.length,
    updated_at: new Date().toISOString(),
    user_id: profile.id,
  };

  finalMessages.unshift(tempSystemMessage);

  finalMessages = finalMessages.map(message => {
    let content;

    if (message.image_paths.length > 0) {
      content = [
        {
          type: 'text',
          text: message.content,
        },
        ...message.image_paths.map(path => {
          let formedUrl = '';

          if (path.startsWith('data')) {
            formedUrl = path;
          } else {
            const chatImage = chatImages.find(image => image.path === path);

            if (chatImage) {
              formedUrl = chatImage.base64;
            }
          }

          return {
            type: 'image_url',
            image_url: {
              url: formedUrl,
            },
          };
        }),
      ];
    } else {
      content = message.content;
    }

    return {
      role: message.role,
      content,
    };
  });

  if (messageFileItems.length > 0) {
    const retrievalText = buildRetrievalText(messageFileItems);

    finalMessages[finalMessages.length - 1] = {
      ...finalMessages[finalMessages.length - 1],
      content: `${finalMessages[finalMessages.length - 1].content}\n\n${retrievalText}`,
    };
  }

  return finalMessages;
}

/**
 * Build the retrieval text from file items.
 *
 * @param {Object[]} fileItems - The file items.
 * @returns {string} The retrieval text.
 */
function buildRetrievalText(fileItems) {
  const retrievalText = fileItems.map(item => `<BEGIN SOURCE>\n${item.content}\n</END SOURCE>`).join('\n\n');

  return `You may use the following sources if needed to answer the user's question. If you don't know the answer, say "I don't know."\n\n${retrievalText}`;
}
function isCodeRelated(summary) {
  const codeKeywords = ['code', 'program', 'function', 'variable', 'syntax', 'algorithm'];
  return codeKeywords.some(keyword => summary.includes(keyword));
}

