const AuthorizationError = require('@/config/constants/errors/AuthorizationError');
const { logger } = require('@/config/logging');
const { User } = require('@/models');
const jwt = require('jsonwebtoken');

// Pull in Environment variables
const ACCESS_TOKEN = {
  secret: process.env.AUTH_ACCESS_TOKEN_SECRET,
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthorizationError('Authentication Error', undefined, 'You are unauthenticated!', {
        error: 'invalid_access_token',
        error_description: 'unknown authentication scheme',
      });
    }

    const accessToken = authHeader.split(' ')[1];

    if (!accessToken) {
      throw new AuthorizationError('Authentication Error', undefined, 'No access token provided', {
        error: 'missing_access_token',
        error_description: 'Access token is missing',
      });
    }

    const decoded = jwt.verify(accessToken, ACCESS_TOKEN.secret);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthorizationError('Authentication Error', undefined, 'User not found', {
        error: 'invalid_user',
        error_description: 'User associated with the token does not exist',
      });
    }

    if (user.authSession.accessToken !== accessToken) {
      throw new AuthorizationError('Authentication Error', undefined, 'Invalid access token', {
        error: 'invalid_access_token',
        error_description: 'Access token does not match the one stored in the user session',
      });
    }

    // Attach authenticated user and Access Token to request object
    req.user = user;
    req.accessToken = accessToken;
    next();
  } catch (err) {
    logger.error(`Authentication error: ${err.message}`);

    if (err.name === 'TokenExpiredError') {
      return next(
        new AuthorizationError('Authentication Error', undefined, 'Token lifetime exceeded!', {
          error: 'expired_access_token',
          error_description: 'Access token is expired',
        })
      );
    }

    if (err instanceof AuthorizationError) {
      return next(err);
    }

    next(
      new AuthorizationError('Authentication Error', undefined, 'An error occurred during authentication', {
        error: 'authentication_error',
        error_description: err.message,
      })
    );
  }
};

module.exports = { authenticate };
