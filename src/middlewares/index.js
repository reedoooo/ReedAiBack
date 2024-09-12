const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { morganMiddleware } = require('./morganMiddleware');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models');
const MongoStore = require('connect-mongo');
const { logger } = require('@/config/logging');
const config = require('@/config');

const middlewares = app => {
  // Set up Helmet for enhanced security, including Content Security Policy (CSP)
  app.use(helmet(config.security.helmet));

  // Use Morgan middleware for logging HTTP requests
  app.use(morganMiddleware);

  // Enable response compression for better performance
  app.use(compression(config.compression));

  // Parse incoming JSON requests
  app.use(express.json());

  // Parse URL-encoded data
  app.use(express.urlencoded({ extended: true }));

  // Parse cookies attached to client requests
  app.use(cookieParser(config.cookie.secret));

  // Configure CORS settings
  app.use(cors(config.cors));

  // Session configuration
  app.use(
    session({
      ...config.session,
      store: new MongoStore({
        mongoUrl: config.database.uri,
      }),
    })
  );

  // Passport configuration for user authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for user authentication
  passport.use(
    new LocalStrategy(config.passport.local, async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user for session management
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Serve static files
  app.use(express.static(config.staticFiles.public));

  config.staticFiles.dirs.forEach(dir => {
    app.use(`/static/${dir}`, cors(config.cors), express.static(path.join(config.staticFiles.public, `static/${dir}`)));
  });

  // Endpoint to serve service-worker.js
  app.get('/service-worker.js', cors(config.cors), (req, res) => {
    res.sendFile(path.resolve(config.staticFiles.public, 'service-worker.js'));
  });

  // Middleware for handling Server-Sent Events
  app.use(async (req, res, next) => {
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.flushHeaders();
    }
    next();
  });

  // Apply rate limiting to prevent abuse and improve security
  app.use(rateLimit(config.rateLimit));
};

module.exports = middlewares;
