const { logger } = require("@/config/logging");

const asyncHandler = fn => (req, res, next) => {
  if (req.body.clientApiKey) {
    process.env.CLIENT_API_KEY = req.body.clientApiKey;
    logger.info(`Client API Key: ${process.env.CLIENT_API_KEY}`);
  }
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
