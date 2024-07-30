
require('dotenv').config();

const getEnv = key => {
  return process.env[key];
};

const validateEnvironmentVariables = () => {
  const requiredEnvVars = ['PINECONE_INDEX'];
  requiredEnvVars.forEach(key => {
    if (!process.env[key]) {
      throw new Error(`Environment variable ${key} is required`);
    }
  });
};


module.exports = {
  getEnv,
  validateEnvironmentVariables,
};
