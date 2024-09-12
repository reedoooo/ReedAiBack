// routes/user/openAi.js
const express = require('express');
const router = express.Router();
const openAiController = require('../../config/env/controllers/user');

// --- User routes ---
router.get('/openAi', openAiController.listUsers);
router.get('/openAi/:user_id', openAiController.retrieveUser);
router.post('/openAi/:user_id', openAiController.modifyUser);
router.delete('/openAi/:user_id', openAiController.deleteUser);

// --- Project routes ---
router.get('/openAi/projects', openAiController.listProjects);
router.post('/openAi/projects', openAiController.createProject);
router.get('/openAi/projects/:project_id', openAiController.retrieveProject);
router.post('/openAi/projects/:project_id', openAiController.modifyProject);
router.post('/openAi/projects/:project_id/archive', openAiController.archiveProject);

// --- Project user routes ---
router.get('/openAi/projects/:project_id/openAi', openAiController.listProjectUsers);

module.exports = router;
