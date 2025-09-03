const express = require("express");
const cors = require("cors");
const supabase = require("./db");
const interestsRouter = require("./userinterests.routes"); // ✅ correct import

const app = express();
const PORT = 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("categories").select("*").limit(3);
  if (error) return res.status(500).send("DB error");
  res.send({ message: "✅ Connected to Supabase!", sampleRows: data });
});

app.use("/interests", interestsRouter);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
