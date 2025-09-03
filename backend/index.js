const express = require("express");
const supabase = require("./db");
const cors = require("cors");
const interestsRouter = require("./interests.routes");

const app = express();
const PORT = 3000;

// middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json()); // parse JSON bodies

// health
app.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("category_id")
      .limit(1);
    if (error) throw error;
    res.send({ message: "Connected to Supabase!", sampleRows: data });
  } catch (err) {
    console.error("Supabase error:", err.message);
    res.send({ message: "Server running", supabase: "unavailable" });
  }
});

// mount your interests & discover endpoints under /api
app.use("/api", interestsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

