// backend/db.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();  // load .env variables

// Use service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;

