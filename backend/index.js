const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const eventRoutes = require("./routes/events");      // event + interested routes
const ratingRoutes = require("./routes/ratings");    // ratings routes

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Middleware to set a userId cookie if it doesn't exist
app.use((req, res, next) => {
  if (!req.cookies.userId) {
    res.cookie("userId", uuidv4(), { httpOnly: true, maxAge: 31536000000 });
  }
  next();
});

// Mount API routes
app.use("/api", eventRoutes);
app.use("/api", ratingRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("✅ Server is running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
