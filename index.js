require('dotenv').config();
require('module-alias/register');

const app = require('./src/app');
const { logger } = require('./src/config/logging');
const { connectDB } = require('./src/db');

async function main() {
  try {
    await connectDB();
    if (process.env.NODE_ENV !== 'test') {
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => logger.info(`Server Open & Connected To Database 🤟: ${PORT}`));
    }
  } catch (error) {
    logger.error(`Failed to start the server: ${error.message}`);
    process.exit(1);
  }
}

main();
