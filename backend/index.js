// index.js
const express = require("express");
// ❌ Removed: require("./fetchAndSyncEvents");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const supabase = require("./db");
const cors = require("cors");

// routes (only events.routes is relevant to Single Event Details page)
const eventRoutes = require("./routes/events.routes");
// (mounted but not used by this page; left as-is without edits)
const ratingsRoutes = require("./routes/ratings.routes");
const eventListRoutes = require("./routes/eventlist.routes");
const interestsRouter = require("./routes/interests.routes");
const userinterestsRouter = require("./routes/userinterests.routes");

const app = express();
const PORT = 3000;

const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// [Shared for this page] set a stable userId cookie for "Interested" feature
app.use((req, res, next) => {
  if (!req.cookies.userId) {
    res.cookie("userId", uuidv4(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 31536000000, // 1 year
      path: "/",
    });
  }
  next();
});

// ------------------- TEST ROUTE (not part of the page) -------------------
app.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .limit(8);
    if (error) throw error;
    res.send({ message: "✅ Connected to Supabase!", sampleRows: data });
  } catch (err) {
    console.error("❌ Supabase error:", err.message);
    res.status(500).send("Connection failed!");
  }
});

// ------------------- ROUTES -------------------
// [Used by Single Event Details page]
app.use("/api", eventRoutes); // includes /events/:id, /events/:id/status, /interested*

// (Mounted but not used by the Single Event Details page)
app.use("/api", interestsRouter);
app.use("/api/events", eventListRoutes);
app.use("/api", ratingsRoutes);
app.use("/api/interests", userinterestsRouter);

// ------------------- START SERVER -------------------
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel serverless
module.exports = app;
