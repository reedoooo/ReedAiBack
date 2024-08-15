// export * from './create.js';
// export * from './main.js';
// export * from './old.js';
// export * from './update.js';
// export * from './query.js';
module.exports = {
  ...require('./create.js'),
  ...require('./main.js'),
  ...require('./update.js'),
  ...require('./query.js'),
  ...require('./get.js'),
  ...require('./customUpsert.js'),
};
