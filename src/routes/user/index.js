// routes/user/index.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { userController } = require('../../controllers/user');
const upload = multer({ dest: 'uploads/' });

router.post('/signup', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.get('/validate-token', userController.validateToken);

// update profile
router.put('/:userId/profile/update', userController.updateUserProfile);

router.post('/upload-profile-image/:userId', upload.single('image'), userController.uploadProfileImage);
router.get('/profile-image/:userId', userController.getProfileImage);
router.get('/refresh-token', userController.refreshToken);

module.exports = router;
