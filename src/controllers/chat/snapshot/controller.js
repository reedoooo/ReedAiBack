const { Snapshot } = require('../../../models');
const { createChatSnapshotService } = require('./service');

async function createChatSnapshot(req, res) {
  const sessionUuid = req.params.uuid;
  const userId = req.user.id; // Assuming userID is set in the request object

  try {
    const snapshotUuid = await createChatSnapshotService(sessionUuid, userId);
    res.json({ uuid: snapshotUuid });
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function getChatSnapshot(req, res) {
  const uuidStr = req.params.uuid;

  try {
    const snapshot = await Snapshot.findOne({ uuid: uuidStr });
    if (!snapshot) {
      return res.status(404).send('Snapshot not found');
    }
    res.json(snapshot);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function chatSnapshotMetaByUserID(req, res) {
  const userId = req.user.id; // Assuming userID is set in the request object

  try {
    const chatSnapshots = await Snapshot.find({ userID: userId });
    res.json(chatSnapshots);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function updateChatSnapshotMetaById(req, res) {
  const uuid = req.params.uuid;
  const { title, summary } = req.body;
  const userId = req.user.id; // Assuming userID is set in the request object

  try {
    const snapshot = await Snapshot.findOneAndUpdate({ uuid, userID: userId }, { title, summary }, { new: true });
    if (!snapshot) {
      return res.status(404).send('Snapshot not found');
    }
    res.json(snapshot);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function deleteChatSnapshot(req, res) {
  const uuid = req.params.uuid;
  const userId = req.user.id; // Assuming userID is set in the request object

  try {
    const snapshot = await Snapshot.findOneAndDelete({ uuid, userID: userId });
    if (!snapshot) {
      return res.status(404).send('Snapshot not found');
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function chatSnapshotSearch(req, res) {
  const search = req.query.search;
  const userId = req.user.id; // Assuming userID is set in the request object

  if (!search) {
    return res.json([]);
  }

  try {
    const chatSnapshots = await Snapshot.find({
      userID: userId,
      $text: { $search: search },
    });
    res.json(chatSnapshots);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = {
  createChatSnapshot,
  getChatSnapshot,
  chatSnapshotMetaByUserID,
  updateChatSnapshotMetaById,
  deleteChatSnapshot,
  chatSnapshotSearch,
};
