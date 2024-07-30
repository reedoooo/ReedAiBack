const { Workspace } = require("../../../models");

router.get('/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId).populate('files');
    res.json({ workspace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});