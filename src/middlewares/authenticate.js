const { logger } = require('@/config/logging');
const { User } = require('@/models');
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      throw new Error('No token provided');
    }
    const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const userId = decodedToken.userId;
    if (!userId) {
      throw new Error('Invalid token');
    }
    // Attach userId to the request object
    req.userId = userId;
    logger.info(`User ID: ${userId}`);
    logger.info(`[USER ID AUTHENTICATED] User ID: ${userId}`);

    const user = await User.findById(decodedToken.userId)
      .populate('profile')
      .populate('workspaces')
      .populate('folders')
      .populate('chatSessions');
    if (req.body.userId && req.body.userId !== userId) {
      throw new Error('Invalid user ID');
    } else {
      // Generate a new access token with updated expiration
      const newToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' } // Set the desired expiration time for the new token
      );
      // Update the response body with the new token and expiration
      res.locals.accessToken = newToken;
      res.locals.expiresIn = 3600; // Set the expiration time in seconds (e.g., 1 hour)
      req.user = user;
      next();
    }
  } catch (error) {
    logger.error(`Authentication failed: ${error.message}`);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
      status: 401,
      stack: error.stack,
    });
  }
};

module.exports = authenticate;
