// models/Component.js

const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const RevisionSchema = new Schema({
  code: String,
  prompt: String,
  createdAt: { type: Date, default: Date.now },
});

const ComponentSchema = new Schema({
  code: String,
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  prompt: String,
  revisions: [RevisionSchema],
  visibility: { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' },
});

const Component = model('Component', ComponentSchema);
const Revision = model('Revision', RevisionSchema);

module.exports = {
  Component: Component,
  Revision: Revision,
};
