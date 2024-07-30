const { getUserId, RespondWithError } = require('../../../utils');
const chatFileService = require('./service');

const getChatFilesByChatId = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chatFiles = await chatFileService.getPCChatFilesByChatId(chatId);
    return res.status(200).json(chatFiles);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createChatFile = async (req, res) => {
  const chatFile = req.body;

  try {
    const createdChatFile = await chatFileService.createPCChatFile(chatFile);
    return res.status(201).json(createdChatFile);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const createChatFiles = async (req, res) => {
  const chatFiles = req.body;

  try {
    const createdChatFiles = await chatFileService.createPCChatFiles(chatFiles);
    return res.status(201).json(createdChatFiles);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const receiveFile = async (req, res) => {
  try {
    const sessionUuid = req.body['sessionUuid']; // should be 'session-uuid' instead of 'chat-session-uuid' be
    const userId = await getUserId(req, res);

    const file = req.file;
    const name = file.originalname;
    const mimeType = file.mimetype;

    const chatFile = await chatFileService.createChatFile({
      sessionUuid: sessionUuid,
      userId: userId,
      name,
      data: file.buffer,
      mimeType,
    });

    const url = `/download/${chatFile.id}`;
    res.status(200).json({ url });
  } catch (err) {
    RespondWithError(res, 500, err.message, err);
  }
};

const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await chatFileService.getChatFileByID(fileId);

    res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(file.data);
  } catch (err) {
    RespondWithError(res, 500, err.message, err);
  }
};

const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    await chatFileService.deleteChatFile(fileId);
    res.sendStatus(200);
  } catch (err) {
    RespondWithError(res, 500, err.message, err);
  }
};

const chatFilesBySessionId = async (req, res) => {
  try {
    const sessionUuid = req.params.uuid;
    const userId = await getUserId(req, res);

    const chatFiles = await chatFileService.listChatFilesBySessionId(sessionUuid, userId);
    res.status(200).json(chatFiles);
  } catch (err) {
    RespondWithError(res, 500, err.message, err);
  }
};

module.exports = {
  getChatFilesByChatId,
  createChatFile,
  createChatFiles,
  receiveFile,
  downloadFile,
  deleteFile,
  chatFilesBySessionId,
};
