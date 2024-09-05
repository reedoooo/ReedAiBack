const { logger } = require("@/config");

const openAiApiRunService = openai => ({
  /**
   * Create a run
   * @param {string} threadId The ID of the thread to create a run for
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
   * @returns The created run object
   */
  createRun: async (threadId, config) => {
    const myRun = await openai.beta.Runs.create(threadId, config);
    logger.info(`Run created: ${JSON.stringify(run, null, 2)}`);
    return myRun;
  },
  /**
   * List all runs for a thread
   * @param {string} threadId The ID of the thread to list runs for
   * @param {object} query Query parameters for filtering the runs
   * @param {number} query.limit The number of runs to return
   * @param {string} query.order The order to sort the runs by
   * @param {string} query.after
   * @param {string} query.before
   * @returns {Array} An array of run objects
   */
  listRuns: async (threadId, query) => {
    const myRuns = await openai.beta.Runs.list(threadId, query);
    console.log(myRuns.data);
    return myRuns.data;
  },
  /**
   * Retrieve a specific run
   * @param {string} threadId The ID of the thread the run belongs to
   * @param {string} runId The ID of the run to retrieve
   * @returns The retrieved run object
   */
  retrieveRun: async (threadId, runId) => {
    const run = await openai.beta.Runs.retrieve(threadId, runId);
    logger.info(`Assistant run: ${JSON.stringify(run, null, 2)}`);
    return run;
  },
  /**
   * Modify a run
   * @param {string} threadId The ID of the thread the run belongs to
   * @param {string} runId The ID of the run to modify
   * @param {object} config The run configuration object
   * @param {object} config.metadata Additional metadata for the run
   * @returns The updated run object
   */
  modifyRun: async (threadId, runId, config) => {
    const myUpdatedRun = await openai.beta.Runs.update(threadId, runId, config);
    console.log(myUpdatedRun);
    return myUpdatedRun;
  },
  /**
   * Delete a run
   * @param {string} threadId The ID of the thread the run belongs to
   * @param {string} runId The ID of the run to delete
   * @returns The deletion response
   */
  deleteRun: async (threadId, runId) => {
    const response = await openai.beta.Runs.delete(threadId, runId);
    console.log(response);
    return response;
  },
  /**
   * Create a thread and run it in one request
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
   * @param {boolean} [config.parallel_tool_calls] Whether to enable parallel function calling during tool use
   * @param {string|object} [config.response_format] Specifies the format that the model must output
   * @returns The created run object
   */
  createThreadAndRun: async config => {
    const myRun = await openai.beta.Threads.createAndRun(config);
    console.log(myRun);
    return myRun;
  },
  /**
   * Submit tool outputs for a run
   * @param {string} threadId The ID of the thread to which this run belongs
   * @param {string} runId The ID of the run that requires the tool output submission
   * @param {object} config The tool output submission configuration object
   * @param {array} config.tool_outputs A list of tools for which the outputs are being submitted
   * @param {boolean} [config.stream] If true, returns a stream of events that happen during the Run as server-sent events
   * @returns The modified run object matching the specified ID
   */
  submitToolOutputs: async (threadId, runId, config) => {
    const myRun = await openai.beta.Threads.Runs.submitToolOutputs(threadId, runId, config);
    console.log(myRun);
    return myRun;
  },
});

module.exports = {
  openAiApiRunService,
};
