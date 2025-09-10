import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savedEvents, setSavedEvents] = useState([]);
  const [interestedEvents, setInterestedEvents] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved events from cookies on component mount
  useEffect(() => {
    const loadSavedEventsFromCookies = () => {
      try {
        const savedEventsCookie = Cookies.get('savedEvents');
        const interestedEventsCookie = Cookies.get('interestedEvents');
        
        if (savedEventsCookie) {
          const parsedSavedEvents = JSON.parse(savedEventsCookie);
          setSavedEvents(parsedSavedEvents);
        }
        
        if (interestedEventsCookie) {
          const parsedInterestedEvents = JSON.parse(interestedEventsCookie);
          setInterestedEvents(parsedInterestedEvents);
        }
      } catch (error) {
        console.error('Error loading events from cookies:', error);
        Cookies.remove('savedEvents');
        Cookies.remove('interestedEvents');
      }
    };

    loadSavedEventsFromCookies();
  }, []);

  // Save to cookies whenever savedEvents changes
  useEffect(() => {
    if (savedEvents.length > 0) {
      Cookies.set('savedEvents', JSON.stringify(savedEvents), { expires: 30 });
    } else {
      Cookies.remove('savedEvents');
    }
  }, [savedEvents]);

  // Save to cookies whenever interestedEvents changes
  useEffect(() => {
    if (interestedEvents.length > 0) {
      Cookies.set('interestedEvents', JSON.stringify(interestedEvents), { expires: 30 });
    } else {
      Cookies.remove('interestedEvents');
    }
  }, [interestedEvents]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3000/api/events");
        if (!response.ok) throw new Error("Failed to fetch events");

        const data = await response.json();
        console.log("Fetched events:", data);
        setEvents(data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getEventId = (event) => event.id || event.event_id;

  const toggleSave = (event) => {
    const eventId = getEventId(event);
    setSavedEvents((prev) => {
      const newSavedEvents = prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId];
      console.log('Updated saved events:', newSavedEvents);
      return newSavedEvents;
    });
  };

  const toggleInterested = (event) => {
    const eventId = getEventId(event);
    setInterestedEvents((prev) => {
      const newInterestedEvents = prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId];
      console.log('Updated interested events:', newInterestedEvents);
      return newInterestedEvents;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>Error: {error}</p>;

  const displayedEvents = showSaved
    ? events.filter((event) => savedEvents.includes(getEventId(event)))
    : events;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header with toggle buttons */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-bold text-gray-800">
          {showSaved ? "Saved Events" : "Events"}
        </h2>

        <div className="flex space-x-4">
          <button
            onClick={() => setShowSaved(false)}
            className={`px-5 py-3 rounded-xl font-semibold text-lg ${
              !showSaved ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setShowSaved(true)}
            className={`px-5 py-3 rounded-xl font-semibold text-lg ${
              showSaved ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Saved Events ({savedEvents.length})
          </button>
        </div>
      </div>

      {displayedEvents.length === 0 ? (
        <p className="text-lg text-gray-600">
          {showSaved ? "No saved events yet" : "No events scheduled"}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
          {displayedEvents.map((event) => {
            const eventId = getEventId(event);
            return (
              <div
                key={eventId}
                className="bg-white border rounded-2xl p-8 shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:border-blue-400"
              >
                <h3 className="text-2xl font-bold mb-4">
                  {event.title || event.event_title || "Untitled Event"}
                </h3>
                <p className="text-gray-700 text-base mb-3">
                  {formatDate(event.start_time)}
                  {event.end_time && ` - ${formatDate(event.end_time)}`}
                </p>
                <p className="text-gray-700 text-base mb-6">
                  {event.location || "No location"}
                </p>

                {/* Buttons */}
                <div className="flex space-x-4">
                  {/* Interested Button */}
                  <button
                    onClick={() => toggleInterested(event)}
                    className={`flex-1 py-3 text-lg rounded-xl transition-all duration-300 ${
                      interestedEvents.includes(eventId)
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    ⭐ Interested
                  </button>

                  {/* Save Button (hidden in Saved view) */}
                  {!showSaved && (
                    <>
                      <button
                        onClick={() => toggleSave(event)}
                        className={`flex-1 py-3 text-lg rounded-xl transition-all duration-300 ${
                          savedEvents.includes(eventId)
                            ? "bg-red-200 text-red-800"
                            : "bg-gray-100 text-gray-700 hover:bg-red-100"
                        }`}
                      >
                        ❤️ {savedEvents.includes(eventId) ? "Saved" : "Save"}
                      </button>
                      <button
                        className="flex-1 py-3 text-lg rounded-xl transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-green-100"
                        onClick={() => alert('More details coming soon!')}
                      >
                        More
                      </button>
                    </>
                  )}
                  
                  {/* Unsave Button (only shown in Saved view) */}
                  {showSaved && (
                    <button
                      onClick={() => toggleSave(event)}
                      className="flex-1 py-3 text-lg rounded-xl transition-all duration-300 bg-red-200 text-red-800 hover:bg-red-300"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Debug info - remove this in production */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Saved Events: {JSON.stringify(savedEvents)}</p>
        <p>Interested Events: {JSON.stringify(interestedEvents)}</p>
      </div>
    </div>
  );
};

export default EventsScreen;