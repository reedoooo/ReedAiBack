module.exports = {
  ...require('./static/assistant'),
  ...require('./static/constants'),
  ...require('./static/system'),
  ...require('./static/templates'),
  ...require('./createMessage'),
  ...require('./createPrompt'),
};
