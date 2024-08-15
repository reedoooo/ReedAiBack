const openAiApiThreadService = openai => ({
  /**
   * Create a thread
   * @param {object} config The thread configuration object
   * @param {Array} config.messages A list of messages to start the thread with
   * @param {object} config.tool_resources Resources for the assistant's tools
   * @param {object} config.metadata Additional metadata for the thread
   * @returns The created thread object
   */
  createThread: async config => {
    const myThread = await openai.beta.Threads.create(config);
    console.log(myThread);
    return myThread;
  },
  /**
   * List all threads
   * @param {object} query Query parameters for filtering the threads
   * @param {string} query.limit The number of threads to return
   * @param {string} query.order The order to sort the threads by
   * @param {string} query.after
   * @param {string} query.before
   * @returns {Array} An array of thread objects
   */
  listThreads: async query => {
    const myThreads = await openai.beta.Threads.list(query);
    console.log(myThreads.data);
    return myThreads.data;
  },
  /**
   * Retrieve a specific thread
   * @param {string} threadId The ID of the thread to retrieve
   * @returns The retrieved thread object
   */
  retrieveThread: async threadId => {
    const thread = await openai.beta.Threads.retrieve(threadId);
    console.log(thread);
    return thread;
  },
  /**
   * Modify a thread
   * @param {string} threadId The ID of the thread to modify
   * @param {object} config The thread configuration object
   * @param {object} config.metadata Additional metadata for the thread
   * @param {object} config.tool_resources Resources for the assistant's tools
   * @returns The updated thread object
   */
  modifyThread: async (threadId, config) => {
    const myUpdatedThread = await openai.beta.Threads.update(threadId, config);
    console.log(myUpdatedThread);
    return myUpdatedThread;
  },
  /**
   * Delete a thread
   * @param {string} threadId The ID of the thread to delete
   * @returns The deletion response
   */
  deleteThread: async threadId => {
    await openai.beta.Threads.delete(threadId);
    const response = await openai.beta.Threads.del(threadId);
    console.log(response);
    return response;
  },
});

module.exports = {
  openAiApiThreadService,
};
