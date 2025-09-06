import React, { useState, useEffect } from "react";

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savedEvents, setSavedEvents] = useState([]);
  const [interestedEvents, setInterestedEvents] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

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
    setSavedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const toggleInterested = (event) => {
    const eventId = getEventId(event);
    setInterestedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with toggle buttons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          {showSaved ? "Saved Events" : "Events"}
        </h2>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowSaved(false)}
            className={`px-4 py-2 rounded-lg font-medium ${
              !showSaved ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setShowSaved(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              showSaved ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
            }`}
          >
            Saved Events
          </button>
        </div>
      </div>

      {displayedEvents.length === 0 ? (
        <p>{showSaved ? "No saved events yet" : "No events scheduled"}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((event) => {
            const eventId = getEventId(event);
            return (
              <div
                key={eventId}
                className="bg-white border rounded-xl p-5 shadow-md transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:border-blue-300"
              >
                <h3 className="text-xl font-semibold mb-2">
                  {event.title || event.event_title || "Untitled Event"}
                </h3>
                <p className="text-gray-700 text-sm mb-2">
                  {formatDate(event.start_time)}
                  {event.end_time && ` - ${formatDate(event.end_time)}`}
                </p>
                <p className="text-gray-700 text-sm mb-4">
                  {event.location || "No location"}
                </p>

                {/* Buttons */}
                <div className="flex space-x-3">
                  {/* Interested Button */}
                  <button
                    onClick={() => toggleInterested(event)}
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${
                      interestedEvents.includes(eventId)
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    ⭐ Interested
                  </button>

                  {/* Save Button (hidden in Saved view) */}
                  {!showSaved && (
                    <>
                      <button
                        onClick={() => toggleSave(event)}
                        className={`flex-1 py-2 rounded-lg transition-all duration-300 ${
                          savedEvents.includes(eventId)
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700 hover:bg-red-50"
                        }`}
                      >
                        ❤️ {savedEvents.includes(eventId) ? "Saved" : "Save"}
                      </button>
                      <button
                        className="flex-1 py-2 rounded-lg transition-all duration-300 bg-gray-100 text-gray-700 hover:bg-green-50"
                        onClick={() => alert('More details coming soon!')}
                      >
                        More
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsScreen;
