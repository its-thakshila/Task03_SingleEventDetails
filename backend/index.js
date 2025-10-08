// // backend/index.js
// const express = require('express');
// const cors = require('cors');
// const supabase = require('./db');

// const app = express();
// app.use(cors()); // allow all origins temporarily // frontend dev server
// app.use(express.json());

// const PORT = 3000;

// // Root endpoint for testing
// app.get('/', (req, res) => {
//   res.send('Backend running ✅');
// });

// // Events API endpoint

// // Events API endpoint
// app.get('/api/events', async (req, res) => {
//   try {
//     // Join events, event_categories, and categories to get category name for each event
//     const { data, error } = await supabase
//       .from('events')
//       .select(`event_id, event_title, start_time, end_time, location, event_categories(category_id, category:categories(category_id, category_name))`)
//       .order('start_time', { ascending: true });

//     if (error) throw error;

//     // Map all categories for each event into an array
//     const eventsWithCategories = (data || []).map(event => {
//       let categories = [];
//       if (event.event_categories && event.event_categories.length > 0) {
//         categories = event.event_categories
//           .filter(ec => ec && ec.category)
//           .map(ec => ({
//             category_id: ec.category.category_id,
//             category_name: ec.category.category_name,
//           }));
//       }
//       return { ...event, categories };
//     });

//     res.json(eventsWithCategories);
//   } catch (err) {
//     console.error('Supabase fetch error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Categories API endpoint/api/categories
// app.get('/api/categories', async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from('categories')
//       .select('category_id, category_name');

//     if (error) throw error;

//     res.json(data);
//   } catch (err) {
//     console.error('Supabase fetch error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// backend/index.js
const express = require('express');
const cors = require('cors');
const supabase = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// --- Swagger setup ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Management API',
      version: '1.0.0',
      description: 'API documentation for Events and Categories',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./index.js'], // you can also point to other files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Root endpoint ---
app.get('/', (req, res) => {
  res.send('Backend running ✅');
});

// --- Events API ---
// #swagger.tags = ['Events']
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events with categories
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   event_id:
 *                     type: integer
 *                   event_title:
 *                     type: string
 *                   start_time:
 *                     type: string
 *                     format: date-time
 *                   end_time:
 *                     type: string
 *                     format: date-time
 *                   location:
 *                     type: string
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         category_id:
 *                           type: integer
 *                         category_name:
 *                           type: string
 */
app.get('/api/events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`event_id, event_title, start_time, end_time, location, event_categories(category_id, category:categories(category_id, category_name))`)
      .order('start_time', { ascending: true });

    if (error) throw error;

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

// --- Categories API ---
/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category_id:
 *                     type: integer
 *                   category_name:
 *                     type: string
 */
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
