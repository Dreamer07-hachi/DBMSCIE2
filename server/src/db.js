import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'pict_erp',
} = process.env;

let pool = null;
let isDbConnected = false;

try {
  pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  });
} catch (err) {
  console.warn('⚠️ Warning: MySQL pool initialization error:', err.message);
}

/**
 * Test MySQL connection and return status
 */
export async function testDbConnection() {
  if (!pool) return false;
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isDbConnected = true;
    console.log(`✅ Connected to MySQL database "${DB_NAME}" on ${DB_HOST}:${DB_PORT}`);
    return true;
  } catch (err) {
    isDbConnected = false;
    console.warn(`⚠️ MySQL is not reachable on ${DB_HOST}:${DB_PORT} (${err.code || err.message}).`);
    console.warn(`   Run "npm run seed" after configuring MySQL credentials in server/.env to use persistent database.`);
    return false;
  }
}

export function getDbStatus() {
  return {
    connected: isDbConnected,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
  };
}

export { pool };
