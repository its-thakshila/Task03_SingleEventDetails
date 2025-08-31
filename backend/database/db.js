const { Pool } = require("pg");

const pool = new Pool({
    connectionString: "postgresql://postgres:2YPTask03@21@db.nvpknwtppuejrffaswlh.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error("❌ Database connection error:", err.stack);
    } else {
        console.log("✅ Database connected successfully!");
        release();
    }
});

module.exports = pool;