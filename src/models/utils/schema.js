const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;
const newSnippetSchema = new mongoose.Schema({
  title: String,
  snippet: String,
});
const commonSchemaFields = {
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
};
const createSchemaFields = fields => ({
  ...fields,
  ...commonSchemaFields,
});
const createSchema = (fields, options = {}) => new Schema(createSchemaFields(fields), { timestamps: true, ...options });
const createModel = (name, schema) => model(name, schema);
const createSnippetModel = createModel('Snippet', newSnippetSchema);

module.exports = {
  createSchema,
  createModel,
};
