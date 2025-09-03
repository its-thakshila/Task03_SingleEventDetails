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
app.get('/api/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')  // your table name in Supabase
      .select('*')
      .order('start_time', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Supabase fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));