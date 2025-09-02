import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Use the dynamically provided backend URL from the environment.
// This ensures the frontend can correctly fetch data from your backend.
const API_BASE_URL = typeof __backend_url !== 'undefined' ? __backend_url : 'http://localhost:3000';

export default function SingleEventDetailPage() {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use useParams to get the 'id' from the URL.
  // The 'id' will be a string, so we convert it to a number.
  const { id } = useParams();
  const eventId = parseInt(id, 10);

  useEffect(() => {
    const fetchEventDetails = async () => {
      // Don't fetch if the eventId is not a valid number.
      if (isNaN(eventId)) {
        setError('Invalid event ID.');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error(`HTTP status: ${response.status}`);
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error('Failed to fetch event details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]); // The effect now depends on eventId, so it re-runs when the URL changes.

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="text-2xl font-semibold text-red-600">Error: Failed to fetch event. Please check the backend server.</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="text-2xl font-semibold text-gray-600">Event not found.</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 font-sans p-4 sm:p-8 min-h-screen flex flex-col items-center">
      <a href="/" className="self-start text-blue-600 hover:text-blue-800 transition duration-300 mb-6">
        &lt;- Back to Home
      </a>
      <div className="w-full max-w-4xl p-6 sm:p-10 bg-white rounded-3xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 mb-2">
            {event.event_title}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
          <div className="bg-gray-100 p-4 rounded-xl shadow-inner">
            <h2 className="font-bold text-gray-700">Location:</h2>
            <p className="text-gray-900">{event.location}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl shadow-inner">
            <h2 className="font-bold text-gray-700">Interested:</h2>
            <p className="text-gray-900">{event.interested_count}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl shadow-inner col-span-1 md:col-span-2">
            <h2 className="font-bold text-gray-700">Description:</h2>
            <p className="text-gray-900">{event.description}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl shadow-inner">
            <h2 className="font-bold text-gray-700">Start Time:</h2>
            <p className="text-gray-900">{formatDate(event.start_time)}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl shadow-inner">
            <h2 className="font-bold text-gray-700">End Time:</h2>
            <p className="text-gray-900">{formatDate(event.end_time)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
