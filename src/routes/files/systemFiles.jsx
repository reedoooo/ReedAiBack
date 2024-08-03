const express = require('express');
const router = express.Router();
const controller = require('../../controllers/files/index.jsx');

// Found at /api/files
router.get('/list-files', controller.getListFiles);
router.get('/:name', controller.download);
router.post('/upload', controller.uploadFile);
router.delete('/:name', controller.deleteFile);
router.get('/:name', controller.getFile);
router.get('/download/:filename', controller.getDownloads);
router.get('/static/chatgpt-prompts-custom.json', controller.downloadCustomPrompts);
router.get('/static/:filename', controller.getFileByType);
router.get('/static-files', controller.getAllStaticJsonFiles);
router.get('/add/prompt', controller.addCustomPrompt);

module.exports = router;
