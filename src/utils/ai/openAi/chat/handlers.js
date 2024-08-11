const { extractContent, parseContent } = require('@/utils/processing');
const EventEmitter = require('node:events');

// --- RESPONSE HANDLER ---
class StreamResponseHandler {
  constructor() {
    this.fullResponse = '';
    this.parsedChunks = [];
  }

  handleChunk(chunk) {
    const content = extractContent(chunk);
    this.fullResponse += content;
    const parsedChunkContent = parseContent(content);
    this.parsedChunks.push(parsedChunkContent);
    return content;
  }

  isResponseComplete() {
    try {
      JSON.parse(this.fullResponse);
      return true;
    } catch {
      return false;
    }
  }

  getFullResponse() {
    return this.fullResponse;
  }

  getParsedChunks() {
    return this.parsedChunks;
  }
}

// --- SUBMIT TOOL OUTPUTS ---
class EventHandler extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
  }

  async onEvent(event) {
    try {
      console.log(event);
      // Retrieve events that are denoted with 'requires_action'
      // since these will have our tool_calls
      if (event.event === 'thread.run.requires_action') {
        await this.handleRequiresAction(event.data, event.data.id, event.data.thread_id);
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
    try {
      const toolOutputs = data.required_action.submit_tool_outputs.tool_calls.map(toolCall => {
        if (toolCall.function.name === 'getCurrentTemperature') {
          return {
            tool_call_id: toolCall.id,
            output: '57',
          };
        } else if (toolCall.function.name === 'getRainProbability') {
          return {
            tool_call_id: toolCall.id,
            output: '0.06',
          };
        }
      });
      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error('Error processing required action:', error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(threadId, runId, {
        tool_outputs: toolOutputs,
      });
      for await (const event of stream) {
        this.emit('event', event);
      }
    } catch (error) {
      console.error('Error submitting tool outputs:', error);
    }
  }
}

// const eventHandler = new EventHandler(client);
// eventHandler.on('event', eventHandler.onEvent.bind(eventHandler));

// const stream = await client.beta.threads.runs.stream(threadId, { assistant_id: assistantId }, eventHandler);

// for await (const event of stream) {
//   eventHandler.emit('event', event);
// }
module.exports = {
  StreamResponseHandler,
  EventHandler,
};
