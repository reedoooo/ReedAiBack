const openAiApiStreamingService = openai => ({
  // STREAMING
  // ============================================================
  /**
   * Stream the result of executing a Run or resuming a Run after submitting tool outputs.
   * @param {string} threadId The ID of the thread to run.
   * @param {object} config The run configuration object
   * @param {string} config.assistant_id The ID of the assistant to use for the run
   * @param {object} [config.instructions] Instructions to override the assistant's default instructions
   * @param {object} [config.additional_instructions] Additional instructions appended to the end of the instructions for the run
   * @param {array} [config.additional_messages] Additional messages to add to the thread before creating the run
   * @param {object} [config.metadata] Additional metadata for the run
   * @param {number} [config.temperature] Sampling temperature to use
   * @param {number} [config.top_p] Nucleus sampling probability
   * @param {number} [config.max_prompt_tokens] Maximum number of prompt tokens
   * @param {number} [config.max_completion_tokens] Maximum number of completion tokens
   * @param {object} [config.truncation_strategy] Strategy for truncating the thread before the run
   * @param {string} [config.tool_choice] Tool choice strategy
   * @param {boolean} [config.stream] If true, returns a stream of events that happen during the run as server-sent events
   * @returns {AsyncGenerator} An async generator yielding streamed events
   */
  streamRun: async function* (threadId, config) {
    const stream = await openai.beta.Runs.create(threadId, { ...config, stream: true });
    for await (const chunk of stream) {
      yield chunk;
    }
  },

  /**
   * Stream the result of creating a thread and running it in one request.
   * @param {object} config The thread and run configuration object
   * @param {string} config.assistant_id The ID of the assistant to use for the run
   * @param {object} config.thread The thread configuration object
   * @param {array} config.thread.messages A list of messages to start the thread with
   * @param {object} [config.thread.tool_resources] Resources for the assistant's tools
   * @param {object} [config.thread.metadata] Additional metadata for the thread
   * @param {object} [config.instructions] Instructions to override the assistant's default instructions
   * @param {object} [config.additional_instructions] Additional instructions appended to the end of the instructions for the run
   * @param {array} [config.additional_messages] Additional messages to add to the thread before creating the run
   * @param {object} [config.metadata] Additional metadata for the run
   * @param {number} [config.temperature] Sampling temperature to use
   * @param {number} [config.top_p] Nucleus sampling probability
   * @param {number} [config.max_prompt_tokens] Maximum number of prompt tokens
   * @param {number} [config.max_completion_tokens] Maximum number of completion tokens
   * @param {object} [config.truncation_strategy] Strategy for truncating the thread before the run
   * @param {string} [config.tool_choice] Tool choice strategy
   * @param {boolean} [config.stream] If true, returns a stream of events that happen during the run as server-sent events
   * @returns {AsyncGenerator} An async generator yielding streamed events
   */
  streamThreadAndRun: async function* (config) {
    const stream = await openai.beta.Threads.createRun({ ...config, stream: true });
    for await (const chunk of stream) {
      yield chunk;
    }
  },
});

module.exports = {
  openAiApiStreamingService,
};
