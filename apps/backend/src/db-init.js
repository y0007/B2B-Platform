const fs = require('fs');
const path = require('path');
const { query } = require('./db-client');

const initDb = async () => {
    try {
        // Check if tables exist
        const res = await query("SELECT to_regclass('public.users')");
        if (res.rows[0].to_regclass) {
            console.log("Database tables already exist. Skipping initialization.");
            return;
        }

        console.log("Initializing database...");

        // Read schema
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await query(schemaSql);
        console.log("Schema applied.");

        // Read seed
        const seedPath = path.join(__dirname, '../seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await query(seedSql);
        console.log("Seed data applied.");

    } catch (err) {
        console.error("Error initializing database:", err);
    }
};

module.exports = { initDb };
