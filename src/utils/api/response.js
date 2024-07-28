// const { Response } = await import('node-fetch');
const setSSEHeader = res => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
};
const RespondWithError = (res, statusCode, message, err) => {
  res.status(statusCode).json({ message, error: err });
};
const createResponse = async (res, statusCode, data) => {
  return res.status(statusCode).json(data);
};

module.exports = {
  RespondWithError,
  createResponse,
  setSSEHeader,
};
