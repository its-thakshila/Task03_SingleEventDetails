// App.jsx
import { Routes, Route, Link } from 'react-router-dom'
import SingleEventDetailPage from '../pages/SingleEventDetailPage.jsx'

const events = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
];

function Home() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Events</h1>

      {/* render cards */}
      <div style={{ display: 'grid', gap: 12 }}>
        {events.map(ev => (
          <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ fontWeight: 600 }}>{ev.id}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* dynamic route: /events/1, /events/2, ... */}
      <Route path="/events/:id" element={<SingleEventDetailPage />} />
    </Routes>
  );
}
