const express = require('express');
const { chatStream } = require('../../controllers');
const { asyncHandler } = require('../../utils/api');
const router = express.Router();

router.post('/stream', asyncHandler(chatStream));

module.exports = router;
