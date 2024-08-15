/**
 * --------------------------------------------
 * [app.js] | Express application setup
 * --------------------------------------------
 */

const express = require('express');
const middlewares = require('./middlewares');
const setupRoutes = require('./routes');
const { errorHandler } = require('./middlewares/error');
const app = express();

middlewares(app);

setupRoutes(app);

app.use(errorHandler);

module.exports = app;
