import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savedEvents, setSavedEvents] = useState([]);
  const [interestedEvents, setInterestedEvents] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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

  // Get unique category names from events
  const categories = Array.from(new Set(events.map(e => e.category_name).filter(Boolean)));

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

  // 🟢 Helper function for status
  const getEventStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now >= startDate && now <= endDate) {
      return { label: "On Going", color: "bg-green-100 text-green-700" };
    } else if (now < startDate) {
      return { label: "Up Coming", color: "bg-yellow-100 text-yellow-700" };
    } else {
      return { label: "Ended", color: "bg-red-100 text-red-700" };
    }
  };

  if (loading) return <p className="p-6">Loading events...</p>;
  if (error) return <p className="p-6">Error: {error}</p>;

  const displayedEvents = showSaved
    ? events.filter((event) => savedEvents.includes(getEventId(event)))
    : events;

  // ✅ Filter by search term & category
  let filteredEvents = displayedEvents.filter(event => {
    const matchesSearch = searchTerm === "" || (event.title || event.event_title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category_name);
    return matchesSearch && matchesCategory;
  });

  // ✅ Sort by status + then by start_time
  const statusOrder = { "On Going": 0, "Up Coming": 1, "Ended": 2 };
  filteredEvents = filteredEvents.sort((a, b) => {
    const statusA = getEventStatus(a.start_time, a.end_time).label;
    const statusB = getEventStatus(b.start_time, b.end_time).label;
    if (statusA === statusB) {
      return new Date(a.start_time) - new Date(b.start_time); // sort by date if same status
    }
    return statusOrder[statusA] - statusOrder[statusB];
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky Header with toggle buttons */}
      <div className="sticky top-0 z-10 bg-white shadow-md border-b border-gray-200">
        <div className="p-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-3xl font-bold text-gray-800">
              {showSaved ? "Saved Events" : "Events"}
            </h2>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="w-full">
                <h2 className="text-3xl font-bold text-gray-800 block md:hidden mb-2 text-center">
                  {showSaved ? "Saved Events" : "Events"}
                </h2>
                <div className="block md:hidden mb-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search events..."
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 w-full"
                  />
                </div>
                <div className="flex flex-row gap-2 w-full md:hidden mb-2">
                  <div className="relative flex-1 min-w-0">
                    <button
                      type="button"
                      className="w-full px-2 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-blue-50 transition-all duration-200 text-sm"
                      onClick={() => setShowCategoryDropdown((prev) => !prev)}
                      style={{textOverflow: 'ellipsis', overflowX: 'auto', whiteSpace: 'nowrap'}}
                      title={selectedCategories.length > 0 ? selectedCategories.join(", ") : "Categories"}
                    >
                      {selectedCategories.length > 0 ? `${selectedCategories.join(", ")}` : "Categories"}
                      <span className="ml-2">▼</span>
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                        {categories.map((cat) => (
                          <label
                            key={cat}
                            className="flex items-center px-2 py-2 cursor-pointer rounded-lg hover:bg-blue-50 transition-all duration-150"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedCategories(prev => [...prev, cat]);
                                } else {
                                  setSelectedCategories(prev => prev.filter(c => c !== cat));
                                }
                              }}
                              className="mr-2 accent-blue-600"
                            />
                            <span className={selectedCategories.includes(cat) ? "font-bold text-blue-700" : "text-gray-800"}>{cat}</span>
                          </label>
                        ))}
                        <div className="flex justify-end mt-2">
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-150"
                            onClick={() => setShowCategoryDropdown(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowSaved(false)}
                    className={`flex-1 min-w-0 px-2 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      !showSaved ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    Events
                  </button>
                  <button
                    onClick={() => setShowSaved(true)}
                    className={`flex-1 min-w-0 px-2 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      showSaved ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    Saved ({savedEvents.length})
                  </button>
                </div>
                <div className="hidden md:flex flex-row w-full md:w-auto items-center gap-2 md:gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search events..."
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                    style={{ minWidth: 200 }}
                  />
                  <div className="relative md:mx-2" style={{flexBasis: '220px', minWidth: '120px'}}>
                    <button
                      type="button"
                      className="w-full px-2 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-blue-50 transition-all duration-200 text-sm"
                      onClick={() => setShowCategoryDropdown((prev) => !prev)}
                      style={{textOverflow: 'ellipsis', overflowX: 'auto', whiteSpace: 'nowrap'}}
                      title={selectedCategories.length > 0 ? selectedCategories.join(", ") : "Categories"}
                    >
                      {selectedCategories.length > 0 ? `${selectedCategories.join(", ")}` : "Categories"}
                      <span className="ml-2">▼</span>
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                        {categories.map((cat) => (
                          <label
                            key={cat}
                            className="flex items-center px-2 py-2 cursor-pointer rounded-lg hover:bg-blue-50 transition-all duration-150"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedCategories(prev => [...prev, cat]);
                                } else {
                                  setSelectedCategories(prev => prev.filter(c => c !== cat));
                                }
                              }}
                              className="mr-2 accent-blue-600"
                            />
                            <span className={selectedCategories.includes(cat) ? "font-bold text-blue-700" : "text-gray-800"}>{cat}</span>
                          </label>
                        ))}
                        <div className="flex justify-end mt-2">
                          <button
                            className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-150"
                            onClick={() => setShowCategoryDropdown(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={() => setShowSaved(false)}
                      className={`flex-1 min-w-0 px-2 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                        !showSaved ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      style={{flexBasis: '120px', minWidth: '100px'}}
                    >
                      Events
                    </button>
                    <button
                      onClick={() => setShowSaved(true)}
                      className={`flex-1 min-w-0 px-2 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                        showSaved ? "bg-blue-600 text-white shadow-md" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      style={{flexBasis: '120px', minWidth: '100px'}}
                    >
                      Saved ({savedEvents.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 pt-4">
        {displayedEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              {searchTerm
                ? `No events found for "${searchTerm}"`
                : showSaved
                  ? "No saved events yet"
                  : "No events scheduled"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const eventId = getEventId(event);
              const status = getEventStatus(event.start_time, event.end_time);

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
                  <p className="text-gray-700 text-sm mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location || "No location"}
                  </p>

                  {/* ✅ Status bubble */}
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                    {status.label}
                  </span>

                  {/* Buttons */}
                  <div className="flex space-x-3 mt-4">
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

                    {showSaved && (
                      <button
                        onClick={() => toggleSave(event)}
                        className="flex-1 py-2 rounded-lg transition-all duration-300 bg-red-100 text-red-700 hover:bg-red-200"
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
      </div>
    </div>
  );
};

export default EventsScreen;
