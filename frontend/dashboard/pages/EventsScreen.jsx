import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import InterestsDialog from "../components/InterestsDialog.jsx";

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const [myEvents, setMyEvents] = useState(() => {
    const saved = localStorage.getItem("myEvents");
    return saved ? JSON.parse(saved) : [];
  });

  const [isMyEventsOpen, setIsMyEventsOpen] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [isEditInterestsOpen, setIsEditInterestsOpen] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = useMemo(
    () => import.meta.env.VITE_API_URL || "http://localhost:3000",
    []
  );

  // Open the Edit Interests modal only once per browser
  useEffect(() => {
    try {
      const seen = localStorage.getItem("seenEditInterestsPrompt");
      if (!seen) {
        setIsEditInterestsOpen(true);
        localStorage.setItem("seenEditInterestsPrompt", "1");
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (!response.ok) throw new Error("Failed to fetch events");
      const data = await response.json();
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (event) => {
    if (!myEvents.find((e) => e.event_id === event.event_id)) {
      const updated = [...myEvents, event];
      updated.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      setMyEvents(updated);
      localStorage.setItem("myEvents", JSON.stringify(updated));

      // 🎉 Trigger success popup
      setShowSavePopup(true);
      setTimeout(() => setShowSavePopup(false), 1500);
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
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
      {/* Header with grouped action buttons */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Events</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/recommended")}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Recommended Events
          </button>
          <button
            onClick={() => setIsEditInterestsOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Edit Interests
          </button>
          <button
            onClick={() => setIsMyEventsOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            My Events
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="mt-2 text-xl font-medium text-gray-900">
            No events scheduled
          </h3>
          <p className="mt-1 text-gray-500">
            Check back later for upcoming events.
          </p>
        </div>
      ) : (
        <div className="events-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.event_id}
              className={`event-card bg-white border border-gray-200 rounded-xl p-5 shadow-sm transition-all duration-300 transform ${
                hoveredEvent === event.event_id
                  ? "shadow-xl scale-105 border-blue-300 ring-2 ring-blue-100"
                  : "hover:shadow-md"
              }`}
              onMouseEnter={() => setHoveredEvent(event.event_id)}
              onMouseLeave={() => setHoveredEvent(null)}
              style={{
                background:
                  hoveredEvent === event.event_id
                    ? "linear-gradient(to bottom right, #ffffff, #f0f9ff)"
                    : "#ffffff",
                transition: "all 0.3s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3
                  className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                    hoveredEvent === event.event_id
                      ? "text-blue-700"
                      : "text-gray-900"
                  }`}
                >
                  {event.event_title}
                </h3>

                {event.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="text-gray-700">
                      {formatDate(event.start_time)}
                      {event.end_time && ` - ${formatDate(event.end_time)}`}
                    </span>
                  </div>

                  {event.location && (
                    <div className="flex items-start">
                      <span className="text-gray-700">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 px-4 rounded-lg font-medium text-blue-600 border border-blue-600 bg-transparent hover:bg-blue-600 hover:text-white transition-colors">
                  Interested
                </button>
                <button
                  className="flex-1 py-2 px-4 rounded-lg font-medium text-red-600 border border-red-600 bg-transparent hover:bg-red-600 hover:text-white transition-colors"
                  onClick={() => handleSave(event)}
                >
                  Save
                </button>
                <button
                  className="flex-1 py-2 px-4 rounded-lg font-medium text-black border border-black bg-transparent hover:bg-black hover:text-white transition-colors"
                  onClick={() => navigate(`/events/${event.event_id}`)}
                >
                  More
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Events Modal */}
      {isMyEventsOpen && (
        <div className="fixed inset-0 flex justify-center items-start pt-20 z-50 backdrop-blur-sm bg-white/20">
          <div className="bg-gradient-to-b from-white to-blue-200 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
              My Events
            </h2>
            <button
              className="absolute top-2 right-2 text-gray-800 hover:text-black font-bold text-xl"
              onClick={() => setIsMyEventsOpen(false)}
            >
              ✕
            </button>
            {myEvents.length === 0 ? (
              <p className="text-center text-gray-600 mt-6">
                No saved events yet.
              </p>
            ) : (
              <ul className="space-y-4 max-h-80 overflow-y-auto">
                {myEvents.map((event) => (
                  <li
                    key={event.event_id}
                    className="flex justify-between items-center p-3 bg-white/70 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {event.event_title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(event.start_time).toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                      onClick={() => {
                        const updated = myEvents.filter(
                          (e) => e.event_id !== event.event_id
                        );
                        setMyEvents(updated);
                        localStorage.setItem(
                          "myEvents",
                          JSON.stringify(updated)
                        );
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Edit Interests Modal */}
      {isEditInterestsOpen && (
        <InterestsDialog
          open={isEditInterestsOpen}
          onClose={() => setIsEditInterestsOpen(false)}
          onSaved={() => setIsEditInterestsOpen(false)} // you can also refresh lists here
        />
      )}

      {/* ✅ Save Success Popup */}
      <AnimatePresence>
        {showSavePopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex justify-center items-center z-[9999]"
          >
            <div className="bg-green-500 text-white p-6 rounded-full shadow-2xl flex items-center justify-center">
              <span className="text-4xl font-bold">✔</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventsScreen;
