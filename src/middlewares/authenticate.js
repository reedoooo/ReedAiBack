const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;
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
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Set the desired expiration time for the new token
      );
      // Update the response body with the new token and expiration
      res.locals.accessToken = newToken;
      res.locals.expiresIn = 3600; // Set the expiration time in seconds (e.g., 1 hour)
      req.user = user;
      next();
    }
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
};

module.exports = authenticate;