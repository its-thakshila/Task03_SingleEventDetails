// backend/routes/events.routes.js
const express = require("express");
const supabase = require("../db");

const router = express.Router();

const fieldMap = {
    title: "event_title",
    description: "description",
    location: "location",
    date: "start_time",
    start_time: "start_time",
    end_time: "end_time",
    interested_count: "interested_count",
};

// ------------------- EVENT ROUTES -------------------

// Get event details
router.get("/events/:id", async (req, res) => {
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
        if (!data || data.length === 0)
            return res.status(404).json({ error: "Event not found" });

        res.json(data[0]);
    } catch (err) {
        console.error("❌ Error fetching event:", err.message);
        res.status(500).json({ error: "Failed to fetch event" });
    }
});

// Get a specific field (title, description, etc.)
Object.keys(fieldMap).forEach((field) => {
    router.get(`/events/:id/${field}`, async (req, res) => {
        const { id } = req.params;
        const selectField = fieldMap[field];
        try {
            const { data, error } = await supabase
                .from("events")
                .select(selectField)
                .eq("event_id", id)
                .limit(1);

            if (error) throw error;
            if (!data || data.length === 0)
                return res.status(404).json({ error: "Event not found" });

            let result = {};
            if (field === "date") {
                result.date = data[0].start_time
                    ? data[0].start_time.split("T")[0]
                    : null;
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

// Event photos
router.get("/events/:id/photos", async (req, res) => {
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

// Event status (Upcoming, Ongoing, Ended)
router.get("/events/:id/status", async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from("events")
            .select("start_time, end_time")
            .eq("event_id", id)
            .limit(1);

        if (error) throw error;
        if (!data || data.length === 0)
            return res.status(404).json({ error: "Event not found" });

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

// Interested count
router.get("/events/:id/interested_counts", async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from("events")
            .select("interested_count")
            .eq("event_id", id)
            .single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Event not found" });
        res.json({
            event_id: id,
            interested_count: Number(data.interested_count) || 0,
        });
    } catch (err) {
        console.error(
            `❌ Failed to fetch interested count for event ${id}:`,
            err.message
        );
        res.status(500).json({ error: "Failed to fetch interested count" });
    }
});

module.exports = router;
