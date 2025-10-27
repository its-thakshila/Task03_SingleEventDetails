const express = require("express"); // Import Express framework
const cookieParser = require("cookie-parser"); // Import cookie parser middleware
const { randomUUID } = require("crypto"); // Import randomUUID to generate unique IDs
const supabase = require("../db"); // Import Supabase database instance

const router = express.Router(); // Create a new Express router
const COOKIE_NAME = "userId"; // Define cookie name constant

// set/read anonymous user cookie
router.use(cookieParser()); // Use cookie parser for all routes

router.use((req, res, next) => { // Middleware to handle user cookie
  let id = req.cookies?.[COOKIE_NAME]; // Read existing userId cookie if it exists

  if (!id) { // If no cookie found
    id = randomUUID(); // Generate a new unique ID
    res.cookie(COOKIE_NAME, id, { // Set new cookie in response
      httpOnly: true, // Prevent client-side JS access for security
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // Set cookie to last 1 year
      path: "/", // Make cookie valid for all routes
    });
  }

  req.userId = id; // Attach userId to request object for later use
  next(); // Continue to next middleware or route handler
}); // End of cookie middleware

//-----------------------------------------------------------------------------------------------------
// GET all categories
router.get("/categories", async (_req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("category_id, category_name")
    .order("category_name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET my interests (with names)
router.get("/interests/me", async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("interested_category")
      .select("category_id")
      .eq("user_id", req.userId);
    if (error) throw error;

    const ids = (rows || []).map(r => r.category_id);
    if (!ids.length) return res.json({ user_id: req.userId, categories: [] });

    const { data: cats, error: cerr } = await supabase
      .from("categories")
      .select("category_id, category_name")
      .in("category_id", ids);
    if (cerr) throw cerr;

    res.json({ user_id: req.userId, categories: cats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// POST replace my interests
router.post("/interests/me", async (req, res) => {
  try {
    const categories = Array.isArray(req.body?.categories)
      ? [...new Set(req.body.categories.map(String))]
      : [];

    // clear current
    const { error: delErr } = await supabase
      .from("interested_category")
      .delete()
      .eq("user_id", req.userId);
    if (delErr) throw delErr;

    if (!categories.length)
      return res.json({ user_id: req.userId, saved: [] });

    const rows = categories.map(id => ({ user_id: req.userId, category_id: id }));
    const { error: insErr } = await supabase
      .from("interested_category")
      .insert(rows);
    if (insErr) throw insErr;

    res.json({ user_id: req.userId, saved: categories });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// GET events matching selected categories, includes category names
router.get("/events/discover", async (req, res) => {
  try {
    const filterIds = String(req.query.categories || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const filterSet = new Set(filterIds.map(String));
    if (!filterIds.length) return res.json({ items: [], total: 0 });

    // event-category mapping
    const { data: mapRows, error: mapErr } = await supabase
      .from("event_categories")
      .select("event_id, category_id");
    if (mapErr) throw mapErr;

    const matchingEventIds = [...new Set(
      (mapRows || [])
        .filter(m => filterSet.has(String(m.category_id)))
        .map(m => m.event_id)
    )];
    if (!matchingEventIds.length) return res.json({ items: [], total: 0 });

    // events
    const { data: events, error: evErr } = await supabase
      .from("events")
      .select("event_id, event_title, start_time, end_time, description, location")
      .in("event_id", matchingEventIds)
      .order("start_time", { ascending: true });
    if (evErr) throw evErr;

    // categories for those events
    const neededCatIds = [...new Set(
      (mapRows || []).filter(m => matchingEventIds.includes(m.event_id))
        .map(m => m.category_id)
    )];
    const { data: cats, error: cErr } = await supabase
      .from("categories")
      .select("category_id, category_name")
      .in("category_id", neededCatIds);
    if (cErr) throw cErr;
    const nameById = new Map(cats.map(c => [c.category_id, c.category_name]));

    const items = events.map(ev => {
      const evCatIds = [...new Set(
        (mapRows || []).filter(m => m.event_id === ev.event_id)
          .map(m => m.category_id)
      )];
      return {
        ...ev,
        categories: evCatIds.map(id => ({
          category_id: id,
          category_name: nameById.get(id) || id,
        })),
      };
    });

    res.json({ items, total: items.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server error" });
  }
});

// GET /api/events/recommended -> based on my saved interests
router.get("/events/recommended", async (req, res) => {
  try {
    // 1) load my category ids
    const { data: mine, error: mErr } = await supabase
      .from("interested_category")
      .select("category_id")
      .eq("user_id", req.userId);
    if (mErr) throw mErr;

    const ids = (mine || []).map(r => r.category_id);
    if (!ids.length) return res.json({ items: [], total: 0 });

    // 2) event-category mapping
    const { data: mapRows, error: mapErr } = await supabase
      .from("event_categories")
      .select("event_id, category_id");
    if (mapErr) throw mapErr;

    const matchEventIds = [...new Set(
      (mapRows || []).filter(m => ids.includes(m.category_id)).map(m => m.event_id)
    )];
    if (!matchEventIds.length) return res.json({ items: [], total: 0 });

    // 3) events
    const { data: events, error: evErr } = await supabase
      .from("events")
      .select("event_id, event_title, start_time, end_time, description, location")
      .in("event_id", matchEventIds)
      .order("start_time", { ascending: true });
    if (evErr) throw evErr;

    // 4) attach category names
    const neededCatIds = [...new Set(
      (mapRows || []).filter(m => matchEventIds.includes(m.event_id)).map(m => m.category_id)
    )];
    const { data: cats, error: cErr } = await supabase
      .from("categories")
      .select("category_id, category_name")
      .in("category_id", neededCatIds);
    if (cErr) throw cErr;

    const nameById = new Map(cats.map(c => [c.category_id, c.category_name]));

    const items = events.map(ev => {
      const evCatIds = [...new Set(
        (mapRows || []).filter(m => m.event_id === ev.event_id).map(m => m.category_id)
      )];
      return {
        ...ev,
        categories: evCatIds.map(id => ({
          category_id: id,
          category_name: nameById.get(id) || id,
        })),
      };
    });

    res.json({ items, total: items.length });
  } catch (e) {
    console.error("GET /events/recommended", e);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
