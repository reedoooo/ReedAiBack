const express = require('express');
const { asyncHandler } = require('@/utils/api');
const router = express.Router();
const { assistantController } = require('@/utils/ai/openAi/assistants');
// --- Assistant endpoints ---
// - Assistant main endpoints -
router.post('/assistants/list', asyncHandler(assistantController.listAssistants));
router.post('/assistants/create', asyncHandler(assistantController.createAssistant));
router.post('/assistants/delete', asyncHandler(assistantController.deleteAssistant));
router.post('/assistants/update', asyncHandler(assistantController.updateAssistant));
// - Assistant file endpoints -
router.post('/assistants/files/upload', asyncHandler(assistantController.uploadFile));
// - Assistant thread endpoints -
router.post('/assistants/threads/create', asyncHandler(assistantController.createThread));
// - Assistant message endpoints -
router.post('/assistants/messages/create', asyncHandler(assistantController.createMessage));
// - Assistant run endpoints -
router.post('/assistants/runs/create', asyncHandler(assistantController.createRun));
router.post('/assistants/runs/createStream', asyncHandler(assistantController.createRunStream));
router.post(
  '/assistants/runs/createStreamWithFunctions',
  asyncHandler(assistantController.createRunStreamWithFunctions)
);
router.post('/assistants/runs/retrieve', asyncHandler(assistantController.retrieveRun));

router.post('/assistants/byThread', asyncHandler(assistantController.getByThread));
router.post('/assistant/test', asyncHandler(assistantController.assistantTest));
module.exports = router;
