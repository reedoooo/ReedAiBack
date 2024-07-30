// errors.js
const ErrUsageLimitExceeded = new Error('usage limit exceeded');
const ErrInvalidCredentials = new Error('invalid credentials');
const ErrInvalidUserID = new Error('invalid user id');
const ErrTokenExpired = new Error('token expired');
const ErrTokenNotYetValid = new Error('token not yet valid');
const ErrTokenMalformed = new Error('token malformed');
const ErrTokenInvalid = new Error('token invalid');
const ErrInvalidOpenAPI = new Error('invalid openapi');
const ErrOpenAiApiError = new Error('openai api error');
const ErrBadRequest = new Error('bad request');
const ErrNotFound = new Error('not found');
const ErrInternalServerError = new Error('internal server error');
const ErrServiceUnavailable = new Error('service unavailable');
const ErrRateLimitExceeded = new Error('rate limit exceeded');
const ErrPermissionDenied = new Error('permission denied');
const ErrResourceConflict = new Error('resource conflict');
const ErrUnprocessableEntity = new Error('unprocessable entity');
const ErrGatewayTimeout = new Error('gateway timeout');

module.exports = {
  ErrUsageLimitExceeded,
  ErrInvalidCredentials,
  ErrInvalidUserID,
  ErrTokenExpired,
  ErrTokenNotYetValid,
  ErrTokenMalformed,
  ErrTokenInvalid,
  ErrInvalidOpenAPI,
  ErrOpenAiApiError,
  ErrBadRequest,
  ErrNotFound,
  ErrInternalServerError,
  ErrServiceUnavailable,
  ErrRateLimitExceeded,
  ErrPermissionDenied,
  ErrResourceConflict,
  ErrUnprocessableEntity,
  ErrGatewayTimeout,
};
