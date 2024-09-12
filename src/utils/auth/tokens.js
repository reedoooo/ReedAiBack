// const jwt = require('jsonwebtoken');
// const { COOKIE_NAME } = require('./constants.js');

// export const createToken = (id, email, expiresIn) => {
//   const payload = { id, email };
//   const token = jwt.sign(payload, process.env.AUTH_REFRESH_TOKEN_SECRET, {
//     expiresIn,
//   });
//   return token;
// };

// export const verifyToken = async (req, res, next) => {
//   const token = req.signedCookies[`${COOKIE_NAME}`];
//   if (!token || token.trim() === '') {
//     return res.status(401).json({ message: 'Token Not Received' });
//   }
//   return new Promise((resolve, reject) => {
//     jwt.verify(token, process.env.AUTH_REFRESH_TOKEN_SECRET, (err, success) => {
//       if (err) {
//         reject(err.message);
//         return res.status(401).json({ message: 'Token Expired' });
//       } else {
//         resolve();
//         res.locals.jwtData = success;
//         return next();
//       }
//     });
//   });
// };
