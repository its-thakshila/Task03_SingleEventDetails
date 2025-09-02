const express = require("express");
const supabase = require("./db"); // correct import

const app = express();
const PORT = 3000;

// TEST ROUTE 
app.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .limit(8);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).send("Connection failed!");
  }

  res.send({
    message: "✅ Connected to Supabase!",
    sampleRows: data,
  });
});

// ROUTE: Get a single event by ID
app.get("/api/events/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        event_id,
        event_title,
        description,
        location,
        start_time,
        end_time,
        event_photos (photo_url)
      `)
      .eq("event_id", id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching event:", err.message);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// ROUTE: Get only title
app.get("/api/events/:id/title", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("events")
      .select("event_title")
      .eq("event_id", id)
      .single();

    if (error) throw error;
    res.json({ title: data.event_title });
  } catch (err) {
    console.error("❌ Error fetching title:", err.message);
    res.status(500).json({ error: "Failed to fetch title" });
  }
});

// ROUTE: Get only description
app.get("/api/events/:id/description", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("events")
      .select("description")
      .eq("event_id", id)
      .single();

    if (error) throw error;

    res.json({ description: data.description });
  } catch (err) {
    console.error("❌ Error fetching description:", err.message);
    res.status(500).json({ error: "Failed to fetch description" });
  }
});

// ROUTE: Get only location
app.get("/api/events/:id/location", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("events")
      .select("location")
      .eq("event_id", id)
      .single();

    if (error) throw error;
    res.json({ location: data.location });
  } catch (err) {
    console.error("❌ Error fetching location:", err.message);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

// ROUTE: Get only date 
app.get("/api/events/:id/date", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("events")
      .select("start_time")
      .eq("event_id", id)
      .single();

    if (error) throw error;
    const date = data.start_time ? data.start_time.split("T")[0] : null;
    res.json({ date });
  } catch (err) {
    console.error("❌ Error fetching date:", err.message);
    res.status(500).json({ error: "Failed to fetch date" });
  }
});

// ROUTE: Get only start time
app.get("/api/events/:id/start_time", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("events")
      .select("start_time")
      .eq("event_id", id)
      .single();

    if (error) throw error;
    res.json({ start_time: data.start_time });
  } catch (err) {
    console.error("❌ Error fetching start time:", err.message);
    res.status(500).json({ error: "Failed to fetch start time" });
  }
});

// ROUTE: Get only end time
app.get("/api/events/:id/end_time", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("events")
      .select("end_time")
      .eq("event_id", id)
      .single();

    if (error) throw error;
    res.json({ end_time: data.end_time });
  } catch (err) {
    console.error("❌ Error fetching end time:", err.message);
    res.status(500).json({ error: "Failed to fetch end time" });
  }
});



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});




// ROUTE: Get only photos
app.get("/api/events/:id/photos", async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("event_photos")
      .select("photo_url")
      .eq("event_id", id);

    if (error) throw error;
    res.json({ photos: data.map((p) => p.photo_url) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});