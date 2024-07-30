const chatPromptService = require('./service');

async function createChatPrompt(req, res) {
  try {
    const promptParams = req.body;
    const prompt = await chatPromptService.createChatPrompt(promptParams);
    res.json(prompt);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function getChatPromptById(req, res) {
  try {
    const id = req.params.id;
    const prompt = await chatPromptService.getChatPromptById(id);
    res.json(prompt);
  } catch (err) {
    res.status(404).send(err.message);
  }
}

async function updateChatPrompt(req, res) {
  try {
    const id = req.params.id;
    const promptParams = req.body;
    const prompt = await chatPromptService.updateChatPrompt(id, promptParams);
    res.json(prompt);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function deleteChatPrompt(req, res) {
  try {
    const id = req.params.id;
    await chatPromptService.deleteChatPrompt(id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function getAllChatPrompts(req, res) {
  try {
    const prompts = await chatPromptService.getAllChatPrompts();
    res.json(prompts);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function getChatPromptsByUserId(req, res) {
  try {
    const id = req.params.id;
    const prompts = await chatPromptService.getChatPromptsByUserId(id);
    res.json(prompts);
  } catch (err) {
    res.status(404).send(err.message);
  }
}

async function deleteChatPromptById(req, res) {
  try {
    const Id = req.params.Id;
    await chatPromptService.deleteChatPromptById(Id);
    res.sendStatus(200);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

async function updateChatPromptById(req, res) {
  try {
    const simpleMsg = req.body;
    const prompt = await chatPromptService.updateChatPromptById(simpleMsg.Id, simpleMsg.text);
    res.json(prompt);
  } catch (err) {
    res.status(400).send(err.message);
  }
}

module.exports = {
  createChatPrompt,
  getChatPromptById,
  updateChatPrompt,
  deleteChatPrompt,
  getAllChatPrompts,
  getChatPromptsByUserId,
  deleteChatPromptById,
  updateChatPromptById,
};
