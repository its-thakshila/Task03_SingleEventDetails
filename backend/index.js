const express = require("express");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const supabase = require("./db"); // correct import
const cors = require("cors");

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

// ------------------- TEST ROUTE -------------------
app.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("events").select("*").limit(8);
    if (error) throw error;

    res.send({ message: "✅ Connected to Supabase!", sampleRows: data });
  } catch (err) {
    console.error("❌ Supabase error:", err.message);
    res.status(500).send("Connection failed!");
  }
});

// ------------------- EVENT ROUTES -------------------
const fieldMap = {
  title: "event_title",
  description: "description",
  location: "location",
  date: "start_time",
  start_time: "start_time",
  end_time: "end_time",
  interested_count: "interested_count",
};

// Get single event by ID (all fields + photos)
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
        interested_count,
        event_photos (photo_url)
      `)
      .eq("event_id", id)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: "Event not found" });

    res.json(data[0]);
  } catch (err) {
    console.error("❌ Error fetching event:", err.message);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Get specific event fields
Object.keys(fieldMap).forEach((field) => {
  app.get(`/api/events/:id/${field}`, async (req, res) => {
    const { id } = req.params;
    const selectField = fieldMap[field];

    try {
      const { data, error } = await supabase
        .from("events")
        .select(selectField)
        .eq("event_id", id)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: "Event not found" });

      let result = {};
      if (field === "date") {
        result.date = data[0].start_time ? data[0].start_time.split("T")[0] : null;
      } else {
        result[field] = data[0][selectField];
      }

      res.json(result);
    } catch (err) {
      console.error(`❌ Error fetching ${field}:`, err.message);
      res.status(500).json({ error: `Failed to fetch ${field}` });
    }
  });
});

// Get only photos
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
    console.error("❌ Error fetching photos:", err.message);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Get status of a specific event
app.get("/api/events/:id/status", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("events")
      .select("start_time, end_time")
      .eq("event_id", id)
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: "Event not found" });

    const { start_time, end_time } = data[0];
    const now = new Date();
    const start = new Date(start_time);
    const end = new Date(end_time);

    let status = "Upcoming";
    if (now >= start && now <= end) status = "Ongoing";
    else if (now > end) status = "Ended";

    res.json({ event_id: id, status });
  } catch (err) {
    console.error(`❌ Failed to fetch status for event ${id}:`, err.message);
    res.status(500).json({ error: "Failed to fetch event status" });
  }
});






// ------------------- INTERESTED EVENTS -------------------

// Mark event as interested (using cookie userId) and update interested_count
app.post("/api/interested", async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.cookies.userId;

  if (!event_id) return res.status(400).json({ error: "event_id is required" });

  try {
    const { data: existing, error: checkError } = await supabase
      .from("interested_events")
      .select("*")
      .eq("user_id", user_id)
      .eq("event_id", event_id);

    if (checkError) throw checkError;
    if (existing.length > 0) return res.json({ message: "Already marked as interested" });

    const { data: inserted, error: insertError } = await supabase
      .from("interested_events")
      .insert([{ user_id, event_id }])
      .select();

    if (insertError) throw insertError;

    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("interested_count")
      .eq("event_id", event_id)
      .single();

    if (fetchError) throw fetchError;

    const newCount = (eventData.interested_count || 0) + 1;

    const { error: updateError } = await supabase
      .from("events")
      .update({ interested_count: newCount })
      .eq("event_id", event_id);

    if (updateError) throw updateError;

    res.status(201).json({ message: `Event ${event_id} marked as interested`, data: inserted });
  } catch (err) {
    console.error("❌ Failed to mark interested:", err.message);
    res.status(500).json({ error: "Failed to mark event as interested" });
  }
});

// Remove an event from interested list using cookie userId
app.delete("/api/interested", async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.cookies.userId;

  if (!event_id) return res.status(400).json({ error: "event_id is required" });
  if (!user_id) return res.status(400).json({ error: "userId cookie is missing" });

  try {
    // Delete interest
    const { error: deleteError } = await supabase
      .from("interested_events")
      .delete()
      .eq("user_id", user_id)
      .eq("event_id", event_id);

    if (deleteError) throw deleteError;

    // Fetch current interested_count
    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("interested_count")
      .eq("event_id", event_id)
      .single();

    if (fetchError) throw fetchError;

    // Decrement count safely
    const newCount = Math.max((Number(eventData.interested_count) || 1) - 1, 0);

    const { error: updateError } = await supabase
      .from("events")
      .update({ interested_count: newCount })
      .eq("event_id", event_id);

    if (updateError) throw updateError;

    res.json({ message: "Event removed from interested list" });
  } catch (err) {
    console.error("❌ Failed to remove event:", err.message);
    res.status(500).json({ error: "Failed to remove event" });
  }
});

// Get all interested events for a user
app.get("/api/interested/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("interested_events")
      .select(`
        event_id,
        events (
          event_title,
          location,
          start_time,
          end_time
        )
      `)
      .eq("user_id", user_id);

    if (error) throw error;
    res.json({ interestedEvents: data });
  } catch (err) {
    console.error("❌ Failed to fetch interested events:", err.message);
    res.status(500).json({ error: "Failed to fetch interested events" });
  }
});

// Get interested count for a specific event (direct from events table)
app.get("/api/events/:id/interested_counts", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("events")
      .select("interested_count")
      .eq("event_id", id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Event not found" });

    res.json({ event_id: id, interested_count: data.interested_count || 0 });
  } catch (err) {
    console.error(`❌ Failed to fetch interested count for event ${id}:`, err.message);
    res.status(500).json({ error: "Failed to fetch interested count" });
  }
});


// ------------------- START SERVER -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
