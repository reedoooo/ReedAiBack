module.exports = {
  ...require('./static/assistant'),
  ...require('./static/constants'),
  ...require('./static/tool'),
  ...require('./static/system'),
  ...require('./static/templates'),
  ...require('./callFunctions'),
  ...require('./createMessage'),
  ...require('./createPrompt'),
};
