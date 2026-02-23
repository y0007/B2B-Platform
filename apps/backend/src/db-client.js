const { Pool } = require('pg');
const { mockQuery } = require('./mock-db');

let pool;
let useMock = false;

const initClient = async () => {
    console.log("Initializing Database Client...");

    if (process.env.USE_MOCK === 'true') {
        console.log("Configuration set to FORCE MOCK.");
        useMock = true;
        return;
    }

    try {
        const connectionString = process.env.DATABASE_URL || "postgres://app:app@localhost:5432/visualsourcing";
        pool = new Pool({
            connectionString,
            connectionTimeoutMillis: 2000 // Short timeout to fail fast if no DB
        });

        // Test connection
        await pool.query('SELECT 1');
        console.log("Connected to PostgreSQL.");
    } catch (err) {
        console.warn("Failed to connect to PostgreSQL:", err.message);
        console.warn("Falling back to IN-MEMORY MOCK DATABASE.");
        useMock = true;
        pool = null;
    }
};

const query = async (text, params) => {
    if (useMock) {
        console.log(`[MOCK DB] ${text}`);
        return mockQuery(text, params);
    }
    return pool.query(text, params);
};

module.exports = { initClient, query };
