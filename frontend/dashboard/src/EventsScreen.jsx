import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="events-screen p-6">
        <h2 className="text-2xl font-bold mb-4">Events</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-screen p-6">
        <h2 className="text-2xl font-bold mb-4">Events</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading events:</p>
          <p>{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="events-screen p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Events</h2>
      
      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-xl font-medium text-gray-900">No events scheduled</h3>
          <p className="mt-1 text-gray-500">Check back later for upcoming events.</p>
        </div>
      ) : (
        <div className="events-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div 
              key={event.event_id} 
              className={`event-card bg-white border border-gray-200 rounded-xl p-5 shadow-sm transition-all duration-300 transform
                ${hoveredEvent === event.event_id ? 
                  'shadow-xl scale-105 border-blue-300 ring-2 ring-blue-100' : 
                  'hover:shadow-md'}`}
              onMouseEnter={() => setHoveredEvent(event.event_id)}
              onMouseLeave={() => setHoveredEvent(null)}
              style={{
                background: hoveredEvent === event.event_id ? 
                  'linear-gradient(to bottom right, #ffffff, #f0f9ff)' : 
                  '#ffffff',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="mb-4">
                {event.interested_count > 0 && (
                  <div className="text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className={`w-4 h-4 mr-1 transition-colors duration-300 ${
                        hoveredEvent === event.event_id ? 'text-red-600' : 'text-red-500'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z" />
                      </svg>
                      <span className={hoveredEvent === event.event_id ? 'font-semibold' : ''}>
                        {event.interested_count} interested
                      </span>
                    </span>
                  </div>
                )}
              </div>
              
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                hoveredEvent === event.event_id ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {event.event_title}
              </h3>
              
              {event.description && (
                <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <svg className={`w-5 h-5 mr-2 mt-0.5 transition-colors duration-300 ${
                    hoveredEvent === event.event_id ? 'text-blue-600' : 'text-blue-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">
                    {formatDate(event.start_time)}
                    {event.end_time && ` - ${formatDate(event.end_time)}`}
                  </span>
                </div>
                
                {event.location && (
                  <div className="flex items-start">
                    <svg className={`w-5 h-5 mr-2 mt-0.5 transition-colors duration-300 ${
                      hoveredEvent === event.event_id ? 'text-blue-600' : 'text-blue-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">{event.location}</span>
                  </div>
                )}
              </div>
              
              <button className={`mt-4 w-full font-medium py-2 px-4 rounded-lg transition-all duration-300 ${
                hoveredEvent === event.event_id ? 
                'bg-blue-700 text-white shadow-lg transform -translate-y-1' : 
                'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add custom styles for smooth transitions */}
      <style jsx>{`
        .event-card {
          transition: all 0.3s ease;
        }
        .event-card:hover {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default EventsScreen;