const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL);

module.exports = db;
