const express = require("express");
const pool = require("./database/db"); // import db.js

const app = express();
const PORT = 3000;

// middleware
app.use(express.json());

// basic route
app.get("/", (req, res) => {
    res.send("Hello, Express is running 🚀");
});

// db test route
app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "✅ Database query successful!",
            time: result.rows[0]
        });
    } catch (err) {
        console.error("❌ Query error:", err.message);
        res.status(500).json({ error: "Database query failed" });
    }
});

// start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
