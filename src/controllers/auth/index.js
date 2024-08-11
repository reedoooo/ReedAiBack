// // controllers/authController.js
// const { createWorkspaces } = require('../../db/data');
// const userService = require('../../services/userService');
// const { genJwtSecretAndAudience, generateToken, validateToken, getExpireSecureCookie } = require('@/utils');

// const createUser = async (req, res) => {
//   try {
//     const userParams = req.body;
//     const user = await userService.createUser(userParams);
//     res.json(user);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const getUserByID = async (req, res) => {
//   try {
//     const userID = req.userID; // Assuming userID is extracted from token
//     const user = await userService.getUserByID(userID);
//     res.json(user);
//   } catch (err) {
//     res.status(404).send(err.message);
//   }
// };

// const updateSelf = async (req, res) => {
//   try {
//     const userID = req.userID; // Assuming userID is extracted from token
//     const userParams = req.body;
//     const user = await User.findByIdAndUpdate(userID, userParams, { new: true }).select('firstName lastName email');
//     res.json(user);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const updateUser = async (req, res) => {
//   try {
//     const userParams = req.body;
//     const user = await User.findOneAndUpdate({ email: userParams.email }, userParams, { new: true });
//     res.json(user);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const signUp = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
// 		const salt = await bcrypt.genSalt();
//     const hash = await bcrypt.hash(password, salt);
//     const userParams = {
//       email,
//       username: username || email,
//       auth: { password: hash }
//     };
//     const user = await userService.createUser(userParams);
// 		const updatedUser = await createWorkspaces(user._id);
// 		const { secret, audience } = genJwtSecretAndAudience();
//     const token = generateToken(updatedUser._id, updatedUser.role, secret, audience, lifetime);
//     const cookie = getExpireSecureCookie(token, false);
//     res.cookie(cookie.name, cookie.value, cookie);
//     res.json({ accessToken: token, expiresIn: jwtSecretAndAudience.lifetime });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await userService.authenticate(email, password);
//     const token = generateToken(user._id, user.role, jwtSecretAndAudience.secret, jwtSecretAndAudience.audience, jwtSecretAndAudience.lifetime);
//     const cookie = getExpireSecureCookie(token, false);
//     res.cookie(cookie.name, cookie.value, cookie);
//     res.json({ accessToken: token, expiresIn: jwtSecretAndAudience.lifetime });
//   } catch (err) {
//     res.status(401).send(err.message);
//   }
// };

// const foreverToken = async (req, res) => {
//   try {
//     const userID = req.userID; // Assuming userID is extracted from token
//     const token = generateToken(userID, req.userRole, jwtSecretAndAudience.secret, jwtSecretAndAudience.audience, 10 * 365 * 24 * 60 * 60); // 10 years
//     res.json({ accessToken: token, expiresIn: 10 * 365 * 24 * 60 * 60 });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const logout = async (req, res) => {
//   try {
//     const tokenString = req.cookies.jwt;
//     const cookie = await userService.logout(tokenString);
//     res.cookie(cookie.name, '', { expires: new Date(0) }); // Clear the cookie
//     res.sendStatus(200);
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// };

// const resetPasswordHandler = async (req, res) => {
//   if (req.method !== 'POST') {
//     res.sendStatus(405);
//     return;
//   }
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       res.sendStatus(404);
//       return;
//     }
//     const tempPassword = generateRandomPassword();
//     const hashedPassword = await bcrypt.hash(tempPassword, 10);
//     user.auth.password = hashedPassword;
//     await user.save();
//     await sendPasswordResetEmail(user.email, tempPassword);
//     res.sendStatus(200);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const changePasswordHandler = async (req, res) => {
//   if (req.method !== 'POST') {
//     res.sendStatus(405);
//     return;
//   }
//   try {
//     const { email, newPassword } = req.body;
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await User.updateOne({ email }, { 'auth.password': hashedPassword });
//     res.sendStatus(200);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const userStatHandler = async (req, res) => {
//   try {
//     const pagination = req.body;
//     const { users, total } = await userService.getUserStats(pagination, jwtSecretAndAudience.defaultRateLimit);
//     res.json({ page: pagination.page, size: pagination.size, total, data: users });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const updateRateLimit = async (req, res) => {
//   try {
//     const { email, rateLimit } = req.body;
//     const updatedRate = await userService.updateRateLimit(email, rateLimit);
//     res.json({ rate: updatedRate });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// const getRateLimit = async (req, res) => {
//   try {
//     const userID = req.userID; // Assuming userID is extracted from token
//     const rate = await userService.getRateLimit(userID);
//     res.json({ rate });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// module.exports = {
// 	// auth
// 	createUser,
// 	getUserByID,
// 	updateSelf,
// 	updateUser,
// 	// setup
// 	signUp,
// 	login,
// 	foreverToken,
// 	logout,
// 	// additional
// 	resetPasswordHandler,
// 	changePasswordHandler,
// 	userStatHandler,
// 	updateRateLimit,
// 	getRateLimit
// };
