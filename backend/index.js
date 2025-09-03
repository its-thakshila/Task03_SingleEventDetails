const express = require("express");
const cors = require("cors");
const supabase = require("./db");
const ratingsRouter = require("./ratings.routes"); // ✅ correct import

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "http://localhost:5173",   // your Vite dev URL
  credentials: true                  // allow cookies
}));
app.use(express.json());

// 👉 mount ratings endpoints
app.use(ratingsRouter);

app.get("/", async (req, res) => {
    const { data, error } = await supabase
        .from("feedback")  // 👈 query your real table
        .select("*")
        .limit(5);         // grab just a few rows for testing

    if (error) {
        console.error("❌ Supabase error:", error.message);
        return res.status(500).send("Connection failed!");
    }

    res.send({
        message: "✅ Connected to Supabase!",
        sampleRows: data,
    });
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});