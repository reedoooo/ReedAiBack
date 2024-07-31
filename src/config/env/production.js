/**
 * Expose
 */

const { getEnv } = require("../../utils/api");

module.exports = {
  db: process.env.MONGODB_URI || getEnv("MONGODB_URI"),
};
