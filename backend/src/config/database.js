const { Pool } = require('pg');

let poolConfig;

const externalDbUrl = process.env.NEON_DATABASE_URL;

if (externalDbUrl) {
  poolConfig = {
    connectionString: externalDbUrl,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  poolConfig = {
    host:     process.env.PGHOST     || process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.PGPORT     || process.env.DB_PORT) || 5432,
    database: process.env.PGDATABASE || process.env.DB_NAME     || 'techlaunch',
    user:     process.env.PGUSER     || process.env.DB_USER     || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ PostgreSQL connected');
  }
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
