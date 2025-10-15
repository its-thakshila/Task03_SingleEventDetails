// dbtest.js
// Simple connectivity test against Supabase (no external DB, no pg Pool).
require('dotenv').config();
const supabase = require('./db');

(async () => {
  try {
    // Head request to count rows in "events" (works even if table is empty)
    const { error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`✅ Supabase reachable. 'events' row count: ${count ?? 0}`);
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    process.exit(1);
  }
})();
