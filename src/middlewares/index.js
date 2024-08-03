const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { morganMiddleware } = require('./morganMiddleware');
const { unifiedErrorHandler } = require('./unifiedErrorHandler');
const path = require('path');
const session = require('express-session');
const { db } = require('../config/env');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { getDB } = require('../db');
const { User } = require('../models');
const MongoStore = require('connect-mongo');
// require('swagger-ui-express');
// require('swagger-jsdoc');

/**
 * Configures and applies middlewares to the Express application.
 *
 * @param {Object} app - The Express application instance.
 */
const middlewares = app => {
  // Set up Helmet for enhanced security, including Content Security Policy (CSP)
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      },
    })
  );

  // Use Morgan middleware for logging HTTP requests
  app.use(morganMiddleware);

  // Enable response compression for better performance
  app.use(compression({ threshold: 512 }));

  // Parse incoming JSON requests
  app.use(express.json());

  // Parse URL-encoded data
  app.use(express.urlencoded({ extended: true }));

  // Parse cookies attached to client requests
  app.use(cookieParser());

  // Configure CORS settings
  const corsOptions = {
    origin: ['http://localhost:3000', '*'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type, Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Configure session management with MongoDB store
  // app.use(
  //   session({
  //     secret: process.env.SESSION_SECRET,
  //     resave: false,
  //     saveUninitialized: false,
  //     store: new MongoStore({ mongooseConnection: require('./db') }),
  //     cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
  //   })
  // );
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      store: new MongoStore({
        mongoUrl: db,
        ttl: 1000 * 60 * 60 * 24, // 1 day
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    })
  );

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

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
  const publicDir = path.join(__dirname, '../../public');
  app.use(express.static(publicDir));

  const staticDirs = ['static', 'uploads', 'downloads', 'files', 'generated'];
  staticDirs.forEach(dir => {
    app.use(`/static/${dir}`, cors(corsOptions), express.static(path.join(publicDir, `static/${dir}`)));
  });

  // Endpoint to serve service-worker.js
  app.get('/service-worker.js', cors(corsOptions), (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/service-worker.js'));
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
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per window
    })
  );

  app.use(unifiedErrorHandler);
};

module.exports = middlewares;
