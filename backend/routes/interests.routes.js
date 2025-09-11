const express = require("express");
const supabase = require("../db");

const router = express.Router();

// Use app-level cookieParser + cookie; just attach userId for convenience
router.use((req, _res, next) => {
  req.userId = req.cookies?.userId;
  next();
});

// NOTE: Category CRUD and "my interests" now live under /api/interests/*
// (see userinterests.routes.js). This file focuses on discovery/recommendations.

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
