const morgan = require('morgan');
require('colors');

morgan.token('coloredMethod', req => `[${req.method.yellow}]`);
morgan.token('coloredStatus', (req, res) => {
  const status = res.statusCode;
  const returnedStatus = status >= 400 ? status.toString().red : status.toString().green;
  return `[${returnedStatus}]`;
});
// const morganMiddleware = morgan((tokens, req, res) => {
//   // Use the custom token 'methodWithUrl' to format the log message
//   return `${tokens.coloredMethod(req)} ${tokens.url(req, res)} ${tokens.coloredStatus(req, res)} ${tokens.res(req, res, 'content-length')} REQ OBJECT: ${req.body ? JSON.stringify(req.body) : ''} REQ HEADERS: ${req.headers ? JSON.stringify(req.headers) : ''}`;
// });
const morganMiddleware = morgan((tokens, req, res) => {
  const method = tokens.coloredMethod(req);
  const url = tokens.url(req, res);
  const status = tokens.coloredStatus(req, res);
  const contentLength = tokens.res(req, res, 'content-length');
  const reqBody = req.body ? JSON.stringify(req.body) : '';
  const reqHeaders = req.headers ? JSON.stringify(req.headers) : '';

  return `${method} ${url} ${status} ${contentLength} REQ OBJECT: ${reqBody}`;
});

module.exports = {
  morganMiddleware,
};
