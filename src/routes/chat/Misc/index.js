const express = require('express');
const router = express.Router();
const controller = require('../../../controllers').chat;
const controllers = {
  ...controller.original,
};
const { chatStream } = controllers;
router.post('/stream', chatStream);

module.exports = router;
