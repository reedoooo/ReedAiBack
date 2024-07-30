const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Error definition
const ErrInvalidToken = new Error('invalid token');

/*
 * Helper functions for managing JWT tokens
 */

/**
 * Generate a random secret and audience for JWT tokens.
 * @returns {Object} An object containing the generated secret and audience.
 * @returns {string} secret - The generated secret.
 * @returns {string} audience - The generated audience.
 */
function genJwtSecretAndAudience() {
  // Generate a random byte string to use as the secret
  const secretBytes = crypto.randomBytes(32);
  const secret = bcrypt.hashSync(secretBytes.toString('base64'), 10);

  // Generate a random string to use as the audience
  const audience = crypto.randomBytes(32).toString('base64').replace(/[+/=]/g, '');

  return { secret, audience };
}

// Generate a JWT token
function generateToken(userID, role, secret, jwtAudience, lifetime) {
  const expires = Math.floor(Date.now() / 1000) + lifetime;
  const notBefore = Math.floor(Date.now() / 1000);
  const issuer = 'https://www.bestqa.net';

  const claims = {
    userId: userID.toString(),
    exp: expires,
    role,
    jti: uuidv4(),
    iss: issuer,
    nbf: notBefore,
    aud: jwtAudience,
  };

  const token = jwt.sign(claims, secret, { algorithm: 'HS256', header: { kid: uuidv4() } });

  return token;
}

// Validate a JWT token
function validateToken(tokenString, secret) {
  try {
    const decoded = jwt.verify(tokenString, secret);
    const userID = parseInt(decoded.user_id, 10);
    if (!userID) throw ErrInvalidToken;
    return userID;
  } catch (err) {
    throw ErrInvalidToken;
  }
}

/*
 * Helper functions for managing user active chat sessions
 */
function getExpireSecureCookie(value, isHttps) {
  const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24 hours
  return {
    name: 'jwt',
    value,
    path: '/',
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Strict',
    expires: expirationDate,
  };
}

module.exports = {
  ErrInvalidToken,
	// JwtSecretAndAudience: genJwtSecretAndAudience(),
  genJwtSecretAndAudience,
  generateToken,
  validateToken,
  getExpireSecureCookie,
};
