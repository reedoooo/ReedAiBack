const morgan = require('morgan');
require('colors');

morgan.token('coloredMethod', req => `[${req.method.yellow}]`);
morgan.token('coloredStatus', (req, res) => {
  const status = res.statusCode;
  const returnedStatus = status >= 400 ? status.toString().red : status.toString().green;
  return `[${returnedStatus}]`;
});

morgan.token('shortReqBody', req => {
  const maxLength = 100; // Maximum length of the logged body string
  const bodyString = req.body ? JSON.stringify(req.body) : '';
  return bodyString.length > maxLength ? `${bodyString.substring(0, maxLength)}...` : bodyString;
});

const morganMiddleware = morgan((tokens, req, res) => {
  const method = tokens.coloredMethod(req);
  const url = tokens.url(req, res);
  const status = tokens.coloredStatus(req, res);
  const contentLength = tokens.res(req, res, 'content-length');
  const reqBody = tokens.shortReqBody(req);
  // logger.info(`REQ BODY: ${JSON.stringify(req.body)}`);
  return `${method} ${url} ${status} ${contentLength} REQ OBJECT: ${reqBody}`;
});

module.exports = {
  morganMiddleware,
};
