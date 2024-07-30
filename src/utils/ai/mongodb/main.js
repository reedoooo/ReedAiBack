import { MongoClient } from "mongodb";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, AIMessage } from "langchain/schema";
import { MongoDBChatMessageHistory } from "langchain-mongodb";

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "langchain";
const collectionName = "chat_history";

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    // Initialize chat model
    const chat = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
    });

    // Initialize MongoDB chat message history
    const chatHistory = new MongoDBChatMessageHistory({
      collection,
      sessionId: "test-session",
    });

    // Add messages to chat history
    await chatHistory.addUserMessage("Hi there!");
    await chatHistory.addAIChatMessage("Hello! How can I assist you today?");
    await chatHistory.addUserMessage("What's the capital of France?");
    await chatHistory.addAIChatMessage("The capital of France is Paris.");

    // Retrieve chat messages
    const messages = await chatHistory.getMessages();
    console.log("Chat messages:", messages);

    // Generate a response based on chat history
    const response = await chat.call([
      ...messages,
      new HumanMessage("Can you summarize our conversation?"),
    ]);

    console.log("AI response:", response.content);

    // Add the new messages to the chat history
    await chatHistory.addUserMessage("Can you summarize our conversation?");
    await chatHistory.addAIChatMessage(response.content);

    // Retrieve updated chat messages
    const updatedMessages = await chatHistory.getMessages();
    console.log("Updated chat messages:", updatedMessages);

    // Clear chat history
    await chatHistory.clear();
    console.log("Chat history cleared");

    // Verify chat history is empty
    const emptyMessages = await chatHistory.getMessages();
    console.log("Empty chat messages:", emptyMessages);

  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

run().catch(console.error);