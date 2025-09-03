const express = require("express");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const supabase = require("./db");
const cors = require("cors");

const app = express();
const PORT = 3000;

const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Set a stable userId cookie if missing
app.use((req, res, next) => {
  if (!req.cookies.userId) {
    res.cookie("userId", uuidv4(), {
      httpOnly: true,
      sameSite: "lax", // same-site with localhost:5173 works
      secure: false,   // OK for local HTTP
      maxAge: 31536000000, // 1 year
      path: "/",
    });
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

// event photos
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


// event status
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

// Mark event as interested
app.post("/api/interested", async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.cookies.userId;
  if (!event_id) return res.status(400).json({ error: "event_id is required" });

  try {
    const { data: existing, error: checkError } = await supabase
      .from("interested_events")
      .select("event_id")
      .eq("user_id", user_id)
      .eq("event_id", event_id)
      .limit(1);
    if (checkError) throw checkError;

    if (existing.length > 0) {
      // Still return the current count to keep client in sync
      const { data: eventData, error: fetchError } = await supabase
        .from("events")
        .select("interested_count")
        .eq("event_id", event_id)
        .single();
      if (fetchError) throw fetchError;
      return res.json({
        message: "Already marked as interested",
        interested_count: Number(eventData?.interested_count) || 0,
      });
    }

    const { error: insertError } = await supabase
      .from("interested_events")
      .insert([{ user_id, event_id }]);
    if (insertError) throw insertError;

    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("interested_count")
      .eq("event_id", event_id)
      .single();
    if (fetchError) throw fetchError;

    const newCount = (Number(eventData?.interested_count) || 0) + 1;

    const { error: updateError } = await supabase
      .from("events")
      .update({ interested_count: newCount })
      .eq("event_id", event_id);
    if (updateError) throw updateError;

    res.status(201).json({ message: `Event ${event_id} marked as interested`, interested_count: newCount });
  } catch (err) {
    console.error("❌ Failed to mark interested:", err.message);
    res.status(500).json({ error: "Failed to mark event as interested" });
  }
});

// Remove interested
app.delete("/api/interested", async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.cookies.userId;
  if (!event_id) return res.status(400).json({ error: "event_id is required" });
  if (!user_id) return res.status(400).json({ error: "userId cookie is missing" });

  try {
    const { error: deleteError } = await supabase
      .from("interested_events")
      .delete()
      .eq("user_id", user_id)
      .eq("event_id", event_id);
    if (deleteError) throw deleteError;

    const { data: eventData, error: fetchError } = await supabase
      .from("events")
      .select("interested_count")
      .eq("event_id", event_id)
      .single();
    if (fetchError) throw fetchError;

    const newCount = Math.max((Number(eventData?.interested_count) || 1) - 1, 0);

    const { error: updateError } = await supabase
      .from("events")
      .update({ interested_count: newCount })
      .eq("event_id", event_id);
    if (updateError) throw updateError;

    res.json({ message: "Event removed from interested list", interested_count: newCount });
  } catch (err) {
    console.error("❌ Failed to remove event:", err.message);
    res.status(500).json({ error: "Failed to remove event" });
  }
});

app.get("/api/interested/status/:event_id", async (req, res) => {
  const { event_id } = req.params;
  const user_id = req.cookies.userId;
  if (!event_id) return res.status(400).json({ error: "event_id is required" });
  if (!user_id) return res.status(400).json({ error: "userId cookie is missing" });

  try {
    const { data, error } = await supabase
      .from("interested_events")
      .select("event_id")
      .eq("user_id", user_id)
      .eq("event_id", event_id)
      .limit(1);
    if (error) throw error;

    const interested = Array.isArray(data) && data.length > 0;
    res.json({ event_id: Number(event_id), interested });
  } catch (err) {
    console.error("❌ Failed to fetch interested status:", err.message);
    res.status(500).json({ error: "Failed to fetch interested status" });
  }
});

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
    res.json({ event_id: id, interested_count: Number(data.interested_count) || 0 });
  } catch (err) {
    console.error(`❌ Failed to fetch interested count for event ${id}:`, err.message);
    res.status(500).json({ error: "Failed to fetch interested count" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
