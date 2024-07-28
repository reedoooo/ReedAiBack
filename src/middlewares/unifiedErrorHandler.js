const { logger } = require('../config/logging/index.js');
function serializeError(error) {
  if (process.env.NODE_ENV !== 'production') {
    const errorDetails = {
      message: error.message, // Standard error message
      name: error.name, // Type of error (e.g., TypeError)
      stack: error.stack, // Stack trace for debugging
      status: error.status || 500, // HTTP status code (default to 500)
      functionName: error.stack.split('\n')[1].trim().split(' ')[1], // Function name, if applicable
    };

    Object.getOwnPropertyNames(error).forEach(key => {
      errorDetails[key] = error[key];
    });
    return JSON.stringify(errorDetails);
  }
  return { message: error.message };
}

const unifiedErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    logger.warn(`[HEADERS SENT] ${res.headersSent}`);
    return next(err);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`[ERROR] ${err.message}`);
  res.status(statusCode).json({
    message,
    error: serializeError(err),
  });
};

module.exports = { unifiedErrorHandler };
