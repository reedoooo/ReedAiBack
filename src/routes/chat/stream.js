const express = require('express');
const streamers = require('@/controllers');
const { asyncHandler } = require('@/utils/api');
const { default: OpenAI } = require('openai');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getUserOpenaiClient } = require('@/utils/ai/openAi/get');
const { logger } = require('@/config/logging');
const { assistantController } = require('@/utils/ai/openAi/assistants');
let fileIds = []; // Store file IDs
let uploadedFileIds = []; // Store uploaded file IDs
const listAndCheckAssistantExistence = async openai => {
  const existingAssistants = await openai.beta.assistants.list();
  if (existingAssistants) {
    logger.info(`Existing assistants: ${JSON.stringify(existingAssistants.data, null, 2)}`);
  }
  const existingAssistant = existingAssistants.data.find(assistant => assistant.name === 'CODING_REACT');
  if (!existingAssistant) {
    throw new Error('Coding_REACT assistant does not exist. Please create it first.');
  }
  return existingAssistant;
};
// --- Chat stream endpoints ---
router.post('/stream', asyncHandler(streamers.chatStream));
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
// router.post(
//   '/assistants/stream',
//   asyncHandler(async (req, res, next) => {
//     try {
//       logger.info(`REQUEST: ${JSON.stringify(req.body)}`);
//       const { toolCallOutputs, runId } = await request.json();

//       const stream = openai.beta.threads.runs.submitToolOutputsStream(
//         threadId,
//         runId,
//         // { tool_outputs: [{ output: result, tool_call_id: toolCallId }] },
//         { tool_outputs: toolCallOutputs }
//       );

//       return new Response(stream.toReadableStream());
//     } catch (err) {
//       console.error('error in post handler ---->', err);
//       // return res.status(500).json({
//       //   success: false,
//       //   message: err,
//       // });
//       next(err);
//     }
//   })
// );
