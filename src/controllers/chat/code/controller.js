const componentService = require('./service');

exports.createComponent = async (req, res) => {
  const userId = req.user._id;
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt cannot be empty' });
  }

  try {
    const componentId = await componentService.createComponent(userId, prompt);
    return res.status(200).json({
      status: 'success',
      data: {
        componentId,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: 'Could not create component' });
  }
};

exports.makeRevision = async (req, res) => {
  const userId = req.user._id;
  const { revisionId, prompt } = req.body;

  try {
    const newRevisionId = await componentService.makeRevision(userId, revisionId, prompt);
    return res.status(200).json({
      status: 'success',
      data: {
        revisionId: newRevisionId,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: 'Could not create revision' });
  }
};

exports.forkRevision = async (req, res) => {
  const userId = req.user._id;
  const { revisionId, includePrevious } = req.body;

  try {
    const newRevisionId = await componentService.forkRevision(userId, revisionId, includePrevious);
    return res.status(200).json({
      status: 'success',
      data: {
        revisionId: newRevisionId,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: 'Could not create component' });
  }
};

exports.getComponent = async (req, res) => {
  const { id } = req.params;

  try {
    const component = await componentService.getComponent(id, req.user._id);
    return res.status(200).json(component);
  } catch (error) {
    return res.status(400).json({ message: 'No component found' });
  }
};

exports.getComponentFromRevision = async (req, res) => {
  const { revisionId } = req.params;

  try {
    const component = await componentService.getComponentFromRevision(revisionId, req.user._id);
    return res.status(200).json(component);
  } catch (error) {
    return res.status(400).json({ message: 'No component found' });
  }
};

exports.getMyComponents = async (req, res) => {
  const userId = req.user._id;
  const { pageIndex = 0, pageSize = 10 } = req.query;

  try {
    const components = await componentService.getMyComponents(userId, pageIndex, pageSize);
    return res.status(200).json({
      status: 'success',
      data: components,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Error fetching components' });
  }
};

exports.importComponent = async (req, res) => {
  const { code, description } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Invalid code snippet' });
  }

  try {
    const componentId = await componentService.importComponent(code, description);
    return res.status(200).json({
      status: 'success',
      data: {
        componentId,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: 'Could not create component' });
  }
};
