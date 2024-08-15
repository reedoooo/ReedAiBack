// // services/jwtSecretService.js
// const { genJwtSecretAndAudience } = require('../utils/auth');

// class JWTSecretService {
//   async getJwtSecret(name) {
//     try {
//       const secret = await JwtSecret.findOne({ name });
//       if (!secret) {
//         throw new Error('Secret not found');
//       }
//       return secret;
//     } catch (err) {
//       throw new Error(`Failed to get secret: ${err.message}`);
//     }
//   }

//   async getOrCreateJwtSecret(name) {
//     try {
//       let secret = await JwtSecret.findOne({ name });
//       if (!secret) {
//         const { secret: secretStr, audience: audStr } = genJwtSecretAndAudience();
//         secret = new JwtSecret({ name, secret: secretStr, audience: audStr });
//         await secret.save();
//       }
//       return secret;
//     } catch (err) {
//       throw new Error(`Failed to create secret: ${err.message}`);
//     }
//   }
// }

// module.exports = new JWTSecretService();
