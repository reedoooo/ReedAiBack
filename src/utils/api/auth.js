const crypto = require('crypto');

const generateToken = () => crypto.randomBytes(64).toString('hex');

console.log('Access Token Secret:', generateToken());
console.log('Refresh Token Secret:', generateToken());
