// backend/index.js
const express = require('express');
const cors = require('cors');
const supabase = require('./db');

const app = express();
app.use(cors()); // allow all origins temporarily // frontend dev server
app.use(express.json());

const PORT = 3000;

// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('Backend running ✅');
});

// Events API endpoint

// Events API endpoint
app.get('/api/events', async (req, res) => {
  try {
    // Join events, event_categories, and categories to get category name for each event
    const { data, error } = await supabase
      .from('events')
      .select(`event_id, event_title, start_time, end_time, location, event_categories(category_id, category:categories(category_id, category_name))`)
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Map all categories for each event into an array
    const eventsWithCategories = (data || []).map(event => {
      let categories = [];
      if (event.event_categories && event.event_categories.length > 0) {
        categories = event.event_categories
          .filter(ec => ec && ec.category)
          .map(ec => ({
            category_id: ec.category.category_id,
            category_name: ec.category.category_name,
          }));
      }
      return { ...event, categories };
    });

    res.json(eventsWithCategories);
  } catch (err) {
    console.error('Supabase fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Categories API endpoint/api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('category_id, category_name');

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Supabase fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));


