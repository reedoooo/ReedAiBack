const openAiApiAssistantService = openai => ({
  /**
   * Create an assistant
   * @param {object} config The assistant configuration object
   * @param {*} config.model
   * @param {*} config.name
   * @param {*} config.description
   * @param {*} config.instructions
   * @param {*} config.tools
   * @param {*} config.tool_resources
   * @param {*} config.metadata
   * @param {*} config.temperature The temperature of the model's responses - type: Number, default: 0.7
   * @param {*} config.top_p The top-p parameter for nucleus sampling - type: Number, default: 1.0
   * @param {*} config.response_format The response format for the assistant's responses - type: String, default: "json"
   * @returns The created assistant object
   */
  createAssistant: async config => {
    const myAssistant = await openai.beta.Assistants.create(config);
    console.log(myAssistant);
    return myAssistant;
  },
  /**
   * List all assistants
   * @param {object} query Query parameters for filtering the assistants
   * @param {string} query.limit The model ID to filter by
   * @param {string} query.order The order to sort the assistants by
   * @param {string} query.after
   * @param {string} query.before
   * @returns {Array} An array of assistant objects
   */
  listAssistants: async query => {
    const myAssistants = await openai.beta.Assistants.list(query);
    console.log(myAssistants.data);
    return myAssistants.data;
  },
  retrieveAssistant: async assistantId => {
    const assistant = await openai.beta.Assistants.retrieve(assistantId);
    console.log(assistant);
    return assistant;
  },
  /**
   * Modify an assistant
   * @param {string} assistantId The ID of the assistant to modify
   * @param {object} config // See @createAssistant for the config object
   * @returns The updated assistant object
   */
  modifyAssistant: async (assistantId, config) => {
    const myUpdatedAssistant = await openai.beta.assistants.update(assistantId, config);
    console.log(myUpdatedAssistant);
    return myUpdatedAssistant;
  },
  deleteAssistant: async assistantId => {
    await openai.beta.Assistants.delete(assistantId);
    const response = await openai.beta.assistants.del(assistantId);
    console.log(response);
    return response;
  },
});

module.exports = {
  openAiApiAssistantService,
};
