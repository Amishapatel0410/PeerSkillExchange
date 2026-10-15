const jwt = require('jsonwebtoken');

/**
 * Signs a JWT that expires in JWT_EXPIRES_IN (default 7d).
 * Payload contains only the user _id; identity is always re-fetched server-side.
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = { signToken };
