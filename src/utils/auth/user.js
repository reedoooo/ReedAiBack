const { logger } = require('@/config/logging');
const mongoose = require('mongoose');

const getUserId = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await mongoose.model('User').findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    return user._id;
  } catch (error) {
    logger.error('Error getting user id:', error.message);
    throw new Error('Error getting user id');
  }
};
function getContextWithUser(userID) {
  const ctx = {};
  ctx[userContextKey] = userID.toString();
  return ctx;
}
const generateObjectId = () => new mongoose.Types.ObjectId();
const generateId = () => require('uuid').v4();

// Function to retrieve the server profile for a given user ID
async function getServerProfile(userId, clientApiKey) {
  if (!userId) {
    console.error('Error: User ID not provided');
    throw new Error('User ID not provided');
  }

  try {
    const Profile = mongoose.model('User'); // Assuming you have a Profile model defined
    const profile = await Profile.findOne({ _id: userId });
    if (!profile) {
      console.error(`Error: Profile not found for user ID ${userId}`);
      throw new Error('Profile not found');
    }

    const profileWithKeys = addApiKeysToProfile(profile, clientApiKey);
    return profileWithKeys;
  } catch (error) {
    console.error('Error fetching server profile:', error);
    throw new Error('Failed to fetch server profile');
  }
}

// Function to add API keys to the profile
function addApiKeysToProfile(profile, clientApiKey) {
  try {
    // const apiKey = process.env.OPENAI_API_KEY;
    checkApiKey(clientApiKey, 'OpenAI');
    profile.openai_api_key = clientApiKey;
    return profile;
  } catch (error) {
    console.error('Error adding API keys to profile:', error);
    throw new Error('Failed to add API keys to profile');
  }
}

// Function to check if an API key is valid
function checkApiKey(apiKey, keyName) {
  if (!apiKey) {
    console.error(`Error: ${keyName} API Key not found`);
    throw new Error(`${keyName} API Key not found`);
  }
}
module.exports = {
  getUserId,
  generateObjectId,
  generateId,
  getServerProfile,
  addApiKeysToProfile,
  checkApiKey,
};
