const { Pinecone } = require('@pinecone-database/pinecone');
const { default: OpenAI } = require('openai');
const { Assistant, User } = require('../../../models');

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function getAssistantImage(assistantId) {
  const assistant = await Assistant.findOne({ id: assistantId });
  if (!assistant || !assistant.image_path) {
    throw new Error('Image not found');
  }
  return assistant.image_path;
}

async function uploadAssistantImage(assistantId, image) {
  if (!image) {
    throw new Error('No file uploaded');
  }

  const assistant = await Assistant.findOne({ id: assistantId });
  if (!assistant) {
    throw new Error('Assistant not found');
  }

  // Delete the old image if it exists
  if (assistant.image_path) {
    fs.unlinkSync(assistant.image_path);
  }

  // Update assistant with new image path
  assistant.image_path = image.path;
  await assistant.save();
  return assistant.image_path;
}

async function getAssistants(userId, clientApiKey) {
  const profile = await getServerProfile(userId, clientApiKey);
  checkApiKey(profile.openai_api_key, 'OpenAI');
  const openai = new OpenAI({
    apiKey: profile.openai_api_key || '',
    organization: profile.openai_organization_id,
  });

  const myAssistants = await openai.beta.assistants.list({ limit: 100 });
  const profileUser = await User.findById(userId);
  if (myAssistants.data.length === 0) {
    const defaults = defaultAssistantsConfig;
    for (const assistant of defaults) {
      const newAssistant = new Assistant({ ...assistant });
      await newAssistant.save();
      profileUser.storage.assistants.push(newAssistant._id);
    }
    await profileUser.save();
  }
  return myAssistants.data.length === 0 ? profileUser.storage.assistants : myAssistants.data;
}

async function createAssistant({ name, instructions, tools, model, userId, clientApiKey }) {
  const profile = await getServerProfile(userId, clientApiKey);
  checkApiKey(profile.openai_api_key, 'OpenAI');
  const openai = new OpenAI({
    apiKey: profile.openai_api_key || '',
    organization: profile.openai_organization_id,
  });
  const assistant = await openai.beta.assistants.create({
    name,
    instructions,
    tools,
    model,
  });
  return assistant;
}

async function updateAssistant({ assistantId, name, instructions, tools, model, userId, clientApiKey }) {
  const profile = await getServerProfile(userId, clientApiKey);
  checkApiKey(profile.openai_api_key, 'OpenAI');
  const openai = new OpenAI({
    apiKey: profile.openai_api_key || '',
    organization: profile.openai_organization_id,
  });
  const assistant = await openai.beta.assistants.update(assistantId, {
    name,
    instructions,
    tools,
    model,
  });
  return assistant;
}

async function deleteAssistant({ assistantId, userId, clientApiKey }) {
  const profile = await getServerProfile(userId, clientApiKey);
  checkApiKey(profile.openai_api_key, 'OpenAI');
  const openai = new OpenAI({
    apiKey: profile.openai_api_key || '',
    organization: profile.openai_organization_id,
  });
  await openai.beta.assistants.delete(assistantId);
}

module.exports = {
  getAssistantImage,
  uploadAssistantImage,
  getAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
};
