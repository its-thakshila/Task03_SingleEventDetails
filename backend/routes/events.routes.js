// backend/routes/events.routes.js
const express = require("express");
const supabase = require("../db");

const router = express.Router();

// [Person 3: Event details (field mapping used by single-field endpoints)]
const fieldMap = {
    title: "event_title",
    description: "description",
    location: "location",
    date: "start_time",
    start_time: "start_time",
    end_time: "end_time",
    interested_count: "interested_count",
};

function computeEventStatus(start_time, end_time, now = new Date()) {
    const start = new Date(start_time);
    const end = new Date(end_time);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "Upcoming";
    }

    if (now >= start && now <= end) return "Ongoing";
    if (now > end) return "Ended";
    return "Upcoming";
}

// ------------------- EVENT ROUTES -------------------

// [Person 3: Event details] GET full event with photos (used by Single Event Details page)
router.get("/events/:id", async (req, res) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
        return res.status(400).json({ error: "Invalid event id" });
    }
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
            .eq("event_id", idNum)
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

// [Person 3: Optional single-field getters for details UI]
Object.keys(fieldMap).forEach((field) => {
    router.get(`/events/:id/${field}`, async (req, res) => {
        const { id } = req.params;
        const idNum = Number(id);
        if (!Number.isFinite(idNum)) {
            return res.status(400).json({ error: "Invalid event id" });
        }
        const selectField = fieldMap[field];
        try {
            const { data, error } = await supabase
                .from("events")
                .select(selectField)
                .eq("event_id", idNum)
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

// [Person 1: Event photos (alternative endpoint; page currently uses photos via /events/:id)]
router.get("/events/:id/photos", async (req, res) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
        return res.status(400).json({ error: "Invalid event id" });
    }
    try {
        const { data, error } = await supabase
            .from("event_photos")
            .select("photo_url")
            .eq("event_id", idNum);

        if (error) throw error;
        res.json({ photos: data.map((p) => p.photo_url) });
    } catch (err) {
        console.error("❌ Error fetching photos:", err.message);
        res.status(500).json({ error: "Failed to fetch photos" });
    }
});

// [Person 4: Event status badge] GET computed status (Upcoming/Ongoing/Ended)
router.get("/events/:id/status", async (req, res) => {
    const { id } = req.params;
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
        return res.status(400).json({ error: "Invalid event id" });
    }
    try {
        const { data, error } = await supabase
            .from("events")
            .select("start_time, end_time")
            .eq("event_id", idNum)
            .limit(1);

        if (error) throw error;
        if (!data || data.length === 0)
            return res.status(404).json({ error: "Event not found" });

    const { start_time, end_time } = data[0];
    const status = computeEventStatus(start_time, end_time);

    res.json({ event_id: idNum, status });
    } catch (err) {
        console.error(`❌ Failed to fetch status for event ${id}:`, err.message);
        res.status(500).json({ error: "Failed to fetch event status" });
    }
});

// ------------------- INTERESTED EVENTS -------------------

// [Person 2: Interested button] Mark event as interested (insert + increment count)
router.post("/interested", async (req, res) => { // Route to mark an event as interested
    const { event_id } = req.body; // Get event_id from request body
    const user_id = req.cookies.userId; // Get user_id from cookies

    if (!event_id) return res.status(400).json({ error: "event_id is required" }); // Check if event_id is missing

    try { // Start try block for database operations
        const { data: existing, error: checkError } = await supabase // Query to check if already interested
            .from("interested_events") // From interested_events table
            .select("event_id") // Select event_id column
            .eq("user_id", user_id) // Match by user_id
            .eq("event_id", event_id) // Match by event_id
            .limit(1); // Limit to 1 result
        if (checkError) throw checkError; // Throw if query error

        if (existing.length > 0) { // If user already marked interested
            const { data: eventData, error: fetchError } = await supabase // Get event data
                .from("events") // From events table
                .select("interested_count") // Select interested_count
                .eq("event_id", event_id) // Match event_id
                .single(); // Expect one result
            if (fetchError) throw fetchError; // Throw if fetch error

            return res.json({ // Return existing message and count
                message: "Already marked as interested", // Info message
                interested_count: Number(eventData?.interested_count) || 0, // Return current count
            });
        }

        const { error: insertError } = await supabase // Insert new interested record
            .from("interested_events") // Into interested_events table
            .insert([{ user_id, event_id }]); // Insert user_id and event_id
        if (insertError) throw insertError; // Throw if insert fails

        const { data: eventData, error: fetchError } = await supabase // Fetch current interested count
            .from("events") // From events table
            .select("interested_count") // Select interested_count
            .eq("event_id", event_id) // Match event_id
            .single(); // Expect one result
        if (fetchError) throw fetchError; // Throw if fetch error

        const newCount = (Number(eventData?.interested_count) || 0) + 1; // Increment count by 1

        const { error: updateError } = await supabase // Update interested_count in events table
            .from("events") // From events table
            .update({ interested_count: newCount }) // Set new interested_count
            .eq("event_id", event_id); // Match by event_id
        if (updateError) throw updateError; // Throw if update fails

        res.status(201).json({ // Send success response
            message: `Event ${event_id} marked as interested`, // Success message
            interested_count: newCount, // Return new count
        });
    } catch (err) { // Catch any error
        console.error("❌ Failed to mark interested:", err.message); // Log error to console
        res.status(500).json({ error: "Failed to mark event as interested" }); // Send error response
    }
}); // End POST route

// [Person 2: Interested button] Remove interested (delete + decrement count)
router.delete("/interested", async (req, res) => { // Route to remove interested status
    const { event_id } = req.body; // Get event_id from body
    const user_id = req.cookies.userId; // Get user_id from cookies

    if (!event_id) return res.status(400).json({ error: "event_id is required" }); // Validate event_id
    if (!user_id) return res.status(400).json({ error: "userId cookie is missing" }); // Validate user_id

    try { // Start try block
        const { error: deleteError } = await supabase // Delete record from interested_events
            .from("interested_events") // From interested_events table
            .delete() // Delete operation
            .eq("user_id", user_id) // Match user_id
            .eq("event_id", event_id); // Match event_id
        if (deleteError) throw deleteError; // Throw if delete fails

        const { data: eventData, error: fetchError } = await supabase // Get current interested_count
            .from("events") // From events table
            .select("interested_count") // Select interested_count
            .eq("event_id", event_id) // Match event_id
            .single(); // Expect one result
        if (fetchError) throw fetchError; // Throw if fetch error

        const newCount = Math.max((Number(eventData?.interested_count) || 1) - 1, 0); // Decrease count but not below 0

        const { error: updateError } = await supabase // Update events table
            .from("events") // From events table
            .update({ interested_count: newCount }) // Set new count
            .eq("event_id", event_id); // Match event_id
        if (updateError) throw updateError; // Throw if update fails

        res.json({ message: "Event removed from interested list", interested_count: newCount }); // Send success response
    } catch (err) { // Catch errors
        console.error("❌ Failed to remove event:", err.message); // Log error
        res.status(500).json({ error: "Failed to remove event" }); // Send error response
    }
}); // End DELETE route

// [Person 2: Interested button] Check current user's interested status
router.get("/interested/status/:event_id", async (req, res) => { // Route to check interested status
    const { event_id } = req.params; // Get event_id from params
    const user_id = req.cookies.userId; // Get user_id from cookies

    if (!event_id) return res.status(400).json({ error: "event_id is required" }); // Validate event_id
    if (!user_id) return res.status(400).json({ error: "userId cookie is missing" }); // Validate user_id

    try { // Try block
        const { data, error } = await supabase // Query interested_events
            .from("interested_events") // From interested_events table
            .select("event_id") // Select event_id
            .eq("user_id", user_id) // Match user_id
            .eq("event_id", event_id) // Match event_id
            .limit(1); // Limit to one
        if (error) throw error; // Throw if query error

        const interested = Array.isArray(data) && data.length > 0; // Check if interested
        res.json({ event_id: Number(event_id), interested }); // Return result
    } catch (err) { // Catch errors
        console.error("❌ Failed to fetch interested status:", err.message); // Log error
        res.status(500).json({ error: "Failed to fetch interested status" }); // Send error response
    }
}); // End GET route

// [Person 2: (aux)] Interested count for an event
router.get("/events/:id/interested_counts", async (req, res) => { // Route to get interested count
    const { id } = req.params; // Get event id from params
    const idNum = Number(id); // Convert id to number

    if (!Number.isFinite(idNum)) { // Validate id
        return res.status(400).json({ error: "Invalid event id" }); // Return error if invalid
    }

    try { // Start try block
        const { data, error } = await supabase // Query events table
            .from("events") // From events table
            .select("interested_count") // Select interested_count
            .eq("event_id", idNum) // Match event_id
            .single(); // Expect one result
        if (error) throw error; // Throw if query error
        if (!data) return res.status(404).json({ error: "Event not found" }); // If no data found

        res.json({ // Send response
            event_id: idNum, // Include event id
            interested_count: Number(data.interested_count) || 0, // Include interested count
        });
    } catch (err) { // Catch block
        console.error(`❌ Failed to fetch interested count for event ${id}:`, err.message); // Log error
        res.status(500).json({ error: "Failed to fetch interested count" }); // Send error response
    }
}); // End GET route

module.exports = router; // Export router module
module.exports.computeEventStatus = computeEventStatus;
