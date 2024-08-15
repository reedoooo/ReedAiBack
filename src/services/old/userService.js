// // services/userService.js
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');
// const { jwtSecretAndAudience, ErrInvalidToken } = require('../utils/auth');
// const { User } = require('../models');

// class UserService {
//   async createUser(userParams) {
//     const totalUserCount = await User.countDocuments({ isActive: true });
//     if (totalUserCount === 0) {
//       userParams.auth.isSuperuser = true;
//       console.log('First user is superuser.');
//     }

//     const newUser = new User(userParams);
//     return newUser.save();
//   }

//   async getUserByID(userID) {
//     return User.findById(userID);
//   }

//   async getAllUsers() {
//     return User.find();
//   }

//   async authenticate(email, password) {
//     const user = await User.findOne({ email });
//     if (!user || !(await bcrypt.compare(password, user.auth.password))) {
//       throw new Error('Invalid credentials');
//     }
//     return user;
//   }

//   async logout(tokenString) {
//     const userID = validateToken(tokenString, jwtSecretAndAudience.secret);
//     const cookie = getExpireSecureCookie(userID, false);
//     return cookie;
//   }

//   async getUserStats(pagination, defaultRateLimit) {
//     const users = await User.aggregate([
//       {
//         $lookup: {
//           from: 'chat_messages',
//           localField: '_id',
//           foreignField: 'userId',
//           as: 'messages',
//         },
//       },
//       {
//         $addFields: {
//           'profile.stats.totalMessages': { $size: '$messages' },
//           'profile.stats.totalTokenCount': { $sum: '$messages.tokenCount' },
//           'profile.stats.totalMessages3Days': {
//             $size: {
//               $filter: {
//                 input: '$messages',
//                 as: 'message',
//                 cond: { $gte: ['$$message.createdAt', new Date(new Date().setDate(new Date().getDate() - 3))] },
//               },
//             },
//           },
//           'profile.stats.totalTokenCount3Days': {
//             $sum: {
//               $map: {
//                 input: {
//                   $filter: {
//                     input: '$messages',
//                     as: 'message',
//                     cond: { $gte: ['$$message.createdAt', new Date(new Date().setDate(new Date().getDate() - 3))] },
//                   },
//                 },
//                 as: 'message',
//                 in: '$$message.tokenCount',
//               },
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: 'auth_user_management',
//           localField: '_id',
//           foreignField: 'userId',
//           as: 'auth.management',
//         },
//       },
//       {
//         $addFields: {
//           'auth.management.rateLimit': {
//             $ifNull: [{ $arrayElemAt: ['$auth.management.rateLimit', 0] }, defaultRateLimit],
//           },
//         },
//       },
//       {
//         $sort: { 'profile.stats.totalMessages': -1, _id: -1 },
//       },
//       {
//         $skip: pagination.offset,
//       },
//       {
//         $limit: pagination.size,
//       },
//     ]);

//     const total = await User.countDocuments({ isActive: true });

//     return { users, total };
//   }

//   async updateRateLimit(userEmail, rateLimit) {
//     const user = await User.findOneAndUpdate(
//       { email: userEmail },
//       { 'auth.management.rateLimit': rateLimit, 'auth.management.updatedAt': Date.now() },
//       { new: true }
//     );
//     return user.auth.management.rateLimit;
//   }

//   async getRateLimit(userID) {
//     const user = await User.findById(userID).select('auth.management.rateLimit');
//     return user.auth.management.rateLimit;
//   }
// }

// module.exports = new UserService();
