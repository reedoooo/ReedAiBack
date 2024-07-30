const { Workspace } = require("../../../models");
const express = require('express');
const router = express.Router();

router.get('/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId).populate('collections');
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;