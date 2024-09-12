require('dotenv').config();
require('module-alias/register');

const { connectDB } = require('@/db/main');
const app = require('./src/app');
const config = require('@/config');
const { logger } = require('@/config/logging');

async function main() {
  try {
    await connectDB();
    if (process.env.NODE_ENV !== 'test') {
      const PORT = config.api.port;
      app.listen(PORT, () => logger.info(`Server Open & Connected To Database 🤟: ${PORT}`));
    }
  } catch (error) {
    logger.error(`Failed to start the server: ${error.message}`);
    process.exit(1);
  }
}

main();