// backend/routes/events.routes.js
const express = require('express');
const supabase = require('../db');

const router = express.Router();

// GET /api/events -> list all events
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events') // your Supabase table
            .select('*')
            .order('start_time', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('Supabase fetch error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
