// services/userService.js
// const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { User } = require('@/models');
require('dotenv').config();

const validateToken = token => {
  try {
    const decoded = jwt.verify(token, process.env.AUTH_REFRESH_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const uploadProfileImage = async (userId, imagePath) => {
  const profile = await User.findOne({ userId }).populate('profile').profile;
  if (!profile) {
    throw new Error('Profile not found');
  }

  if (profile.imagePath) {
    fs.unlink(path.join(__dirname, '..', profile.imagePath), err => {
      if (err) console.error('Error deleting old image:', err);
    });
  }

  profile.imagePath = imagePath;
  await profile.save();
  return profile;
};

const getProfileImage = async userId => {
  const profile = await User.findOne({ userId }).populate('profile').profile;
  if (!profile || !profile.imagePath) {
    throw new Error('Image not found');
  }

  return path.resolve(profile.imagePath);
};

const updateUserProfile = async (userId, updatedData) => {
  const user = await User.findOne({ userId }).populate('profile');
  const profile = user.profile;
  if (!profile) {
    throw new Error('Profile not found');
  }
  Object.assign(profile, updatedData);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

module.exports = {
  // registerUser,
  // loginUser,
  // logoutUser,
  validateToken,
  uploadProfileImage,
  getProfileImage,
  updateUserProfile,
};
