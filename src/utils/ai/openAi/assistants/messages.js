const { logger } = require("@/config");

const openAiApiMessageService = openai => ({
  /**
   * Create a message
   * @param {string} threadId The ID of the thread to create a message for
   * @param {object} config The message configuration object
   * @param {string} config.role The role of the entity creating the message (e.g., 'user' or 'assistant')
   * @param {string} config.content The content of the message
   * @param {array} [config.attachments] A list of files attached to the message
   * @param {object} [config.metadata] Additional metadata for the message
   * @returns The created message object
   */
  createMessage: async (threadId, config) => {
    const myMessage = await openai.beta.Messages.create(threadId, config);
    console.log(myMessage);
    return myMessage;
  },
  /**
   * List all messages in a thread
   * @param {string} threadId The ID of the thread to list messages for
   * @param {object} query Query parameters for filtering the messages
   * @param {number} query.limit The number of messages to return
   * @param {string} query.order The order to sort the messages by
   * @param {string} query.after
   * @param {string} query.before
   * @returns {Array} An array of message objects
   */
  listMessages: async (threadId, query) => {
    const myMessages = await openai.beta.Messages.list(threadId, query);
    logger.info(`Messages: ${JSON.stringify(messages, null, 2)}`);
    return myMessages.data;
  },
  /**
   * Retrieve a specific message
   * @param {string} threadId The ID of the thread the message belongs to
   * @param {string} messageId The ID of the message to retrieve
   * @returns The retrieved message object
   */
  retrieveMessage: async (threadId, messageId) => {
    const message = await openai.beta.Messages.retrieve(threadId, messageId);
    console.log(message);
    return message;
  },
  /**
   * Modify a message
   * @param {string} threadId The ID of the thread the message belongs to
   * @param {string} messageId The ID of the message to modify
   * @param {object} config The message configuration object
   * @param {object} config.metadata Additional metadata for the message
   * @returns The updated message object
   */
  modifyMessage: async (threadId, messageId, config) => {
    const myUpdatedMessage = await openai.beta.Messages.update(threadId, messageId, config);
    console.log(myUpdatedMessage);
    return myUpdatedMessage;
  },
  /**
   * Delete a message
   * @param {string} threadId The ID of the thread the message belongs to
   * @param {string} messageId The ID of the message to delete
   * @returns The deletion response
   */
  deleteMessage: async (threadId, messageId) => {
    const response = await openai.beta.Messages.delete(threadId, messageId);
    console.log(response);
    return response;
  },
});

module.exports = {
  openAiApiMessageService,
};
