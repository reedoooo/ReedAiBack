const express = require('express');
const { asyncHandler } = require('@/utils/api/sync.js');
// const vectorController = require('../controllers/vectorController.js');
const authenticate = require('@/middlewares/authenticate.js');
const { upsertDocs } = require('@/utils/ai/pinecone/customUpsert.js');
const { queryComponents } = require('@/utils/ai/pinecone/query.js');

const router = express.Router();

router.use(authenticate);

router.post('/upsert-docs', asyncHandler(upsertDocs));
router.post('/query-components', asyncHandler(queryComponents));

module.exports = router;
