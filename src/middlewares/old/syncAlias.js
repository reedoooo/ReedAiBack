const { Schema } = require('mongoose');

const createIdUuidVirtuals = (schema, idField, uuidField) => {
  schema.virtual(uuidField).get(function () {
    return this[idField] && this[idField].toString();
  });
};

const idUuidSyncMiddleware = (idField, uuidField) =>
  function (next) {
    if (this[idField] && !this[uuidField]) {
      this[uuidField] = this[idField].toString();
    }
    next();
  };

const updateIdUuidSyncMiddleware = (idField, uuidField) =>
  function (next) {
    this.findOneAndUpdate({}, { $set: { [uuidField]: this._update[idField].toString() } });
    next();
  };

module.exports = {
  createIdUuidVirtuals,
  idUuidSyncMiddleware,
  updateIdUuidSyncMiddleware,
};
