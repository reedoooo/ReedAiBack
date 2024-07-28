/**
 * Expose
 */

const { getEnv } = require("../../utils");

module.exports = {
  db: process.env.MONGODB_URI || getEnv("MONGODB_URI"),
};
