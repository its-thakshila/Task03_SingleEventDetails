import React, { useState } from 'react';

const EventsScreen = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      name: "Tech Conference 2024",
      description: "Annual technology conference featuring the latest innovations.",
      date: "2024-10-15",
      image: "https://via.placeholder.com/400x200"
    },
    {
      id: 2,
      name: "Music Festival",
      description: "Three-day music festival with top artists from around the world.",
      date: "2024-11-20",
      image: "https://via.placeholder.com/400x200"
    }
  ]);

  return (
    <div className="events-screen p-6">
      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      <div className="events-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => (
          <div key={event.id} className="event-card border rounded-lg p-4 shadow-md">
            <img src={event.image} alt={event.name} className="w-full h-48 object-cover rounded-md mb-3" />
            <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
            <p className="text-gray-600 mb-2">{event.description}</p>
            <p className="text-blue-600 font-medium">{event.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsScreen;