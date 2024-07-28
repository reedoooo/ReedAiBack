const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { morganMiddleware } = require('./morganMiddleware');
const path = require('path');

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

  // Serve static files from the 'public' directory
  const publicDir = path.join(__dirname, '../../public');
  app.use(express.static(publicDir));
  app.use('/static', cors(corsOptions), express.static(path.join(publicDir, 'static')));
  app.use('/static/uploads', cors(corsOptions), express.static(path.join(publicDir, 'static/uploads')));
  app.use('/static/downloads', cors(corsOptions), express.static(path.join(publicDir, 'static/downloads')));
  app.use('/static/files', cors(corsOptions), express.static(path.join(publicDir, 'static/files')));
  app.use('/static/generated', cors(corsOptions), express.static(path.join(publicDir, 'static/generated')));
  // app.use('/images', express.static(path.join(publicDir, 'images')));
  // app.use('/fonts', express.static(path.join(publicDir, 'fonts')));

  // Endpoint to serve service-worker.js
  app.get('/service-worker.js', cors(corsOptions), (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../public/service-worker.js'));
  });

  // Middleware for handling Server-Sent Events
  app.use((req, res, next) => {
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
};

module.exports = middlewares;
