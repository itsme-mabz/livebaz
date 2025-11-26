// init-schema.js
const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' });


const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'hamdan1514',
  port: process.env.DB_PORT || 5432,
});

const initializeDatabase = async () => {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Create database if not exists
    await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'spcl'}`);
    console.log(`✅ Database ${process.env.DB_NAME || 'spcl'} created`);
    
    await client.end();
  } catch (error) {
    if (error.code === '42P04') { // Database already exists
      console.log(`✅ Database ${process.env.DB_NAME || 'spcl'} already exists`);
    } else {
      console.error('Error creating database:', error.message);
    }
    await client.end();
  }
};

const createTables = async () => {
  const clientWithDB = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'spcl',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await clientWithDB.connect();

    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "IsAdmin" BOOLEAN DEFAULT FALSE;
      );
    `;

    await clientWithDB.query(schema);
    console.log('✅ Users table created successfully');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await clientWithDB.end();
  }
};

// Run initialization
initializeDatabase().then(() => {
  createTables();
});