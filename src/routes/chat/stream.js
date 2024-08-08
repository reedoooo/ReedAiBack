const express = require('express');
const streamers = require('../../controllers');
const { asyncHandler } = require('../../utils/api');
const upload = require('../../middlewares/upload');
const router = express.Router();

router.post('/stream', asyncHandler(streamers.chatStream));
router.get('/stream/upload', asyncHandler(streamers.uploadToFileStream));

module.exports = router;
