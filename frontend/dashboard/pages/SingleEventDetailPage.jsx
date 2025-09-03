import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../src/SingleEventDetailPage.css';

// SVG Icon imports - Add your icon import URLs here
import ClockIcon from '../icons/clock.svg';
import LocationIcon from '../icons/location.svg';
import StarIcon from '../icons/star.svg';
import RateIcon from '../icons/rate.svg';
import ArrowLeftIcon from '../icons/arrow-left.svg';

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
    // 'currentImageIndex' tracks which image is currently displayed in the carousel.
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // 'isDescriptionExpanded' tracks if the description is expanded on mobile
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    // Carousel navigation functions
    const goToNextImage = () => {
        if (event.event_photos && event.event_photos.length > 1) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === event.event_photos.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    const goToPrevImage = () => {
        if (event.event_photos && event.event_photos.length > 1) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === 0 ? event.event_photos.length - 1 : prevIndex - 1
            );
        }
    };

    const goToImage = (index) => {
        setCurrentImageIndex(index);
    };

    // Function to toggle description expansion
    const toggleDescription = () => {
        setIsDescriptionExpanded(!isDescriptionExpanded);
    };

    // Conditional rendering for the different states of the component.
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-text">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-text">Error: Failed to fetch event. Please check the backend server.</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="not-found-container">
                <div className="not-found-text">Event not found.</div>
            </div>
        );
    }

    // Format the date range
    const startDate = formatDate(event.start_time);
    const endDate = formatDate(event.end_time);
    const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'N/A';

    // Once the data is fetched and ready, we render the event details.
    return (
        <div className="event-detail-container">
            {/* Mobile Navigation Bar */}
            <div className="mobile-nav-bar">
                <a href="/" className="mobile-back-button">
                    <img src={ArrowLeftIcon} alt="Back" className="mobile-back-icon" />
                </a>
                <h2 className="mobile-nav-title">Details</h2>
                <div className="mobile-nav-spacer"></div>
            </div>

            {/* The main container for all event details. */}
            <div className="event-content">
                {/* Left section with event details */}
                <div className="event-left-section">
                    {/* Desktop back button */}
                    <a href="/" className="back-button">
                        <img src={ArrowLeftIcon} alt="Back" className="back-icon" />
                        Back
                    </a>

                    <div className="event-header">
                        <div className="event-title-row">
                            <h1 className="event-title">{event.event_title}</h1>
                            {/* Status badge inline with title */}
                            {status && (
                                <span className={`event-status ${status.toLowerCase()}`}>
                                    {status}
                                </span>
                            )}
                        </div>
                        <div className="event-description-container">
                            <p className={`event-description ${isDescriptionExpanded ? 'expanded' : ''}`}>
                                {event.description}
                            </p>
                            {/* Show More/Less button only on mobile */}
                            <button className="description-toggle" onClick={toggleDescription}>
                                {isDescriptionExpanded ? 'Less' : 'More'}
                            </button>
                        </div>
                    </div>

                    <div className="event-details">
                        <div className="detail-item">
                            <img src={ClockIcon} alt="Time" className="detail-icon" />
                            <div className="detail-content">
                                <div className="detail-value">{dateRange}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <img src={LocationIcon} alt="Location" className="detail-icon" />
                            <div className="detail-content">
                                <div className="detail-value">{event.location}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <img src={StarIcon} alt="Interested" className="detail-icon" />
                            <div className="detail-content">
                                <div className="detail-value">{event.interested_count} People Interested</div>
                            </div>
                        </div>
                    </div>

                    {/* Rate event button */}
                    <button className="rate-button">
                        <img src={RateIcon} alt="Rate" className="rate-icon" />
                        Rate Event
                    </button>
                </div>

                {/* Right section with photo carousel or placeholder */}
                {event.event_photos && event.event_photos.length > 0 ? (
                    <div className="photo-carousel">
                        <div className={`carousel-container ${event.event_photos.length === 1 ? 'single-image' : ''}`}>
                            <div
                                className="carousel-track"
                                style={{
                                    transform: `translateX(-${currentImageIndex * 100}%)`
                                }}
                            >
                                {event.event_photos.map((photo, index) => (
                                    <div key={index} className="carousel-slide">
                                        <img
                                            src={photo.photo_url}
                                            alt={`Event Photo ${index + 1}`}
                                            className="carousel-image"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Navigation arrows (only show if more than 1 image) */}
                            {event.event_photos.length > 1 && (
                                <>
                                    <button
                                        className="carousel-navigation carousel-prev"
                                        onClick={goToPrevImage}
                                        aria-label="Previous image"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        className="carousel-navigation carousel-next"
                                        onClick={goToNextImage}
                                        aria-label="Next image"
                                    >
                                        ›
                                    </button>
                                </>
                            )}

                            {/* Dots indicator (only show if more than 1 image) */}
                            {event.event_photos.length > 1 && (
                                <div className="carousel-dots">
                                    {event.event_photos.map((_, index) => (
                                        <button
                                            key={index}
                                            className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                                            onClick={() => goToImage(index)}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="no-image-placeholder">
                        No Image Found
                    </div>
                )}
            </div>
        </div>
    );
}