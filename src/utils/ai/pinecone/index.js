// export * from './create.js';
// export * from './main.js';
// export * from './old.js';
// export * from './update.js';
// export * from './query.js';
module.exports = {
  ...require('./create.js'),
  ...require('./main.js'),
  ...require('./old.js'),
  ...require('./update.js'),
  ...require('../../api/query.js'),
  ...require('./get.js'),
};
