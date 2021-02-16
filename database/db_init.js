const spicedPg = require('spiced-pg');
const db = spicedPg(process.env.DATABASE_URL || secrets.DB_KEY);

module.exports = db;
