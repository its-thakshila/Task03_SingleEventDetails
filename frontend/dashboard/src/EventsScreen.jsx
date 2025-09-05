import React, { useState, useEffect } from "react";

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);

  // State for actions
  const [savedEvents, setSavedEvents] = useState([]);       // ❤️
  const [interestedEvents, setInterestedEvents] = useState([]); // ⭐

  // "events" | "saved"
  const [activeTab, setActiveTab] = useState("events");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (id) => {
    setSavedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const toggleInterested = (id) => {
    setInterestedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const opts = { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleDateString("en-US", opts);
  };

  // Decide which events to show
  const displayedEvents =
    activeTab === "saved"
      ? events.filter((e) => savedEvents.includes(e.id || e.event_id))
      : events;

  if (loading) return <p>Loading events...</p>;
  if (error)
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={fetchEvents}>Try Again</button>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Top bar: tabs */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          {activeTab === "events" ? "Events" : "Saved Events"}
        </h2>
        <div className="space-x-3">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "events"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "saved"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Saved Events
          </button>
        </div>
      </div>

      {displayedEvents.length === 0 ? (
        <p>{activeTab === "events" ? "No events scheduled." : "No saved events yet."}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((event) => {
            const id = event.id || event.event_id;
            const isSaved = savedEvents.includes(id);
            const isInterested = interestedEvents.includes(id);

            return (
              <div
                key={id}
                className={`bg-white border rounded-xl p-5 shadow-sm transition-all duration-300 transform ${
                  hoveredEvent === id
                    ? "shadow-xl scale-105 border-blue-300"
                    : "hover:shadow-md"
                }`}
                onMouseEnter={() => setHoveredEvent(id)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    hoveredEvent === id ? "text-blue-700" : "text-gray-900"
                  }`}
                >
                  {event.event_title || event.title || "⚠️ Missing title"}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-3">
                  {event.description || "⚠️ No description"}
                </p>

                <p className="text-gray-700 text-sm mb-2">
                  {formatDate(event.start_time)}
                  {event.end_time && ` - ${formatDate(event.end_time)}`}
                </p>

                <p className="text-gray-700 text-sm mb-4">
                  {event.location || "⚠️ No location"}
                </p>

                {/* Action buttons */}
                <div className="flex space-x-3 mt-auto">
                  {/* ⭐ Interested always shown in both tabs */}
                  <button
                    onClick={() => toggleInterested(id)}
                    className={`flex-1 py-2 rounded-lg transition-all duration-300 ${
                      isInterested
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-50"
                    }`}
                  >
                    ⭐ Interested
                  </button>

                  {/* ❤️ Save: HIDE ONLY when we're in Saved tab (and these are saved) */}
                  {!(activeTab === "saved" && isSaved) && (
                    <button
                      onClick={() => toggleSave(id)}
                      className={`flex-1 py-2 rounded-lg transition-all duration-300 ${
                        isSaved
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700 hover:bg-red-50"
                      }`}
                    >
                      ❤️ Save
                    </button>
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
