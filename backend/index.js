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

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,        // e.g. https://your-frontend.vercel.app
  "http://localhost:5173"
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser tools (curl/postman with no Origin) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());

// [Shared for this page] set a stable userId cookie for "Interested" feature
app.use((req, res, next) => {
  if (!req.cookies.userId) {
    res.cookie("userId", uuidv4(), {
      httpOnly: true,
      sameSite: "none",
      secure: true,
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
