// routes/user/local.js
const express = require('express');
const router = express.Router();
const userController = require('../../controllers');

// --- INITIALIZE ROUTES ---
router.post('/signup', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.post('/refresh-token', userController.refreshAccessToken);

// --- INITIALIZE ROUTES ---
router.post('/:userId/addApiKey', userController.addApiKey);

// --- AUTHENTICATION ROUTES ---
router.get('/validate-token', userController.validateToken);
// router.get('/refresh-token', userController.refreshToken);

// --- USER PROFILE ROUTES ---
router.put('/:userId/profile/update', userController.updateUserProfile);
router.get('/profile-image/:userId', userController.getProfileImage);

module.exports = router;
