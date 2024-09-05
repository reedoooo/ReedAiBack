const { Assistant, File, Message } = require('@/models');

const createLocalAssistant = async config => {
  const newAssistant = await new Assistant(config).save();
  console.log(newAssistant);
  return newAssistant;
};
const createLocalFile = async config => {
  const newFile = await new File(config).save();
  console.log(newFile);
  return newFile;
};
const createLocalMessage = async config => {
  const newMessage = await new Message(config).save();
  console.log(newMessage);
  return newMessage;
};

module.exports = {
  createLocalAssistant,
  createLocalFile,
  createLocalMessage,
};
