
// App.jsx
import { Routes, Route, Link } from 'react-router-dom'
import SingleEventDetailPage from '../pages/SingleEventDetailPage.jsx'
import { useState } from 'react'
import Eventcard   from "../components/eventcard.jsx";
import EventsScreen from './EventsScreen'; // added 
import './App.css'

const events = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
  { id: 8 },
  { id: 9 },
  { id: 10 },
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

  return(
    <div className="App">
      <h1 className="text-3xl font-bold underline">
      </h1>

      {/* Add new EventsScreen component */}
      <EventsScreen/>

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

export default App


