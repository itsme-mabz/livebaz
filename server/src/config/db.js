
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'hamdan1514',
  database: process.env.DB_NAME || 'spcl',
  port: process.env.DB_PORT || 5432,
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log(`✅ Connected to ${process.env.DB_NAME || 'spcl'} PostgreSQL database`);
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

testConnection();

module.exports = pool;