import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// This is the base URL for the backend API.
// It is dynamically provided by the environment to ensure the frontend can communicate with the backend correctly.
// A fallback to 'http://localhost:3000' is included for local development.
const API_BASE_URL = typeof __backend_url !== 'undefined' ? __backend_url : 'http://localhost:3000';

export default function SingleEventDetailPage() {
  // We use useState hooks to manage the component's state.
  // 'event' will hold the fetched event data.
  const [event, setEvent] = useState(null);
  // 'loading' tracks if the data is currently being fetched.
  const [loading, setLoading] = useState(true);
  // 'error' stores any error messages that occur during the fetch.
  const [error, setError] = useState(null);
  // 'status' will hold the event's current status (e.g., 'Upcoming', 'Ongoing').
  const [status, setStatus] = useState(null);

  // The useParams hook from react-router-dom is used to get the dynamic 'id'
  // from the URL, which we use to identify the specific event to fetch.
  const { id } = useParams();
  const eventId = parseInt(id, 10);

  // This useEffect hook is responsible for fetching the main event details.
  // The effect re-runs whenever the 'eventId' changes in the URL.
  useEffect(() => {
    const fetchEventDetails = async () => {
      // First, we check if the event ID is a valid number. If not, we set an error
      // and stop the fetch process to prevent unnecessary API calls.
      if (isNaN(eventId)) {
        setError('Invalid event ID.');
        setLoading(false);
        return;
      }
      
      try {
        // We start the loading state before making the fetch call.
        setLoading(true);
        // This fetch call retrieves all the event details, including the 'event_category'
        // and 'event_photos' data, which were added in the previous update.
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error(`HTTP status: ${response.status}`);
        }
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        // If an error occurs during the fetch, we log it and set the error state.
        console.error('Failed to fetch event details:', err);
        setError(err.message);
      } finally {
        // We always set loading to false in the 'finally' block, regardless of success or failure.
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]); // The dependency array ensures this effect runs when 'eventId' changes.

  // This new useEffect hook is specifically for fetching the event status.
  // We make a separate API call to get this information.
  useEffect(() => {
    const fetchEventStatus = async () => {
      if (isNaN(eventId)) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/status`);
        if (!response.ok) {
          throw new Error(`HTTP status: ${response.status}`);
        }
        const data = await response.json();
        // The data contains the status string, which we store in the state.
        setStatus(data.status);
      } catch (err) {
        console.error('Failed to fetch event status:', err);
      }
    };
    // We only fetch the status once the main event data has been loaded.
    if (event) {
        fetchEventStatus();
    }
  }, [eventId, event]); // This effect depends on both 'eventId' and 'event' data.

  // A helper function to format the date string into a more readable format.
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

  // Conditional rendering for the different states of the component.
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

  // Once the data is fetched and ready, we render the event details.
  return (
    <div className="bg-gray-50 font-sans p-4 sm:p-8 min-h-screen flex flex-col items-center">
      {/* A link to go back to the home page for easy navigation. */}
      <a href="/" className="self-start text-blue-600 hover:text-blue-800 transition duration-300 mb-6">
        &lt;- Back to Home
      </a>
      {/* The main container for all event details. */}
      <div className="w-full max-w-4xl p-6 sm:p-10 bg-white rounded-3xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 mb-2">
            {event.event_title}
          </h1>
          {/* We now display the event category, which was added in a previous update. */}
          <p className="text-lg text-gray-500 font-medium">{event.event_category}</p>
          {/* We also display the event status, which is a new feature. */}
          {status && (
            <span className={`inline-block px-3 py-1 mt-2 text-sm font-semibold rounded-full ${
              status === 'Ongoing' ? 'bg-green-200 text-green-800' :
              status === 'Upcoming' ? 'bg-blue-200 text-blue-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              {status}
            </span>
          )}
        </div>
        
        {/* We conditionally render the gallery section only if there are photos available. */}
        {event.event_photos && event.event_photos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Photos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {event.event_photos.map((photo, index) => (
                <div key={index} className="rounded-xl overflow-hidden shadow-lg">
                  <img 
                    src={photo.photo_url} 
                    alt={`Event Photo ${index + 1}`} 
                    className="w-full h-48 object-cover transform transition-transform duration-300 hover:scale-105" 
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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
        
        {/* We have added a button to allow users to provide feedback.
        This is a visual element only and is not yet linked to any functionality. */}
        <div className="flex justify-center mt-6">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Give Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
