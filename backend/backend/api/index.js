require('dotenv').config();

const connectDB = require('../src/config/db');
const app = require('../src/app');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database connection failed' }));
    return;
  }

  return app(req, res);
};
