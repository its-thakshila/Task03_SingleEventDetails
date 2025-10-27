// [Single Event Details Page ONLY]
// Ownership map:
//   - Person 1: Event Image (carousel)
//   - Person 2: Interested button (Rate button is navigation-only on this page)
//   - Person 3: Event details (title, description, time, venue)
//   - Person 4: Event status badge + Share button

import React, { useState, useEffect, useRef } from 'react';
import { Share2 } from 'lucide-react'; // [Person 4] Share button icon
import { useParams, Link } from 'react-router-dom';
import './SingleEventdetailPage.css';
import { API } from '../api';

import ClockIcon from '../icons/clock.svg';
import LocationIcon from '../icons/location.svg';
import StarIcon from '../icons/star.svg';
import RateIcon from '../icons/rate.svg';
import ArrowLeftIcon from '../icons/arrow-left.svg';

const API_BASE_URL = API;

export default function SingleEventDetailPage() {
    // [Shared page state]
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // [Person 4] Event status badge state
    const [status, setStatus] = useState(null);

    // [Person 1] Carousel state
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // [Person 2] Interested button state
    const [isInterested, setIsInterested] = useState(false);
    const [interestPending, setInterestPending] = useState(false);

    const { id } = useParams();
    const eventId = Number.isNaN(Number(id)) ? null : Number(id);

    const interestedReqIdRef = useRef(0);

    // [Person 3] Fetch event details (title, description, time, venue, photos, interested_count)
    useEffect(() => {
        if (eventId == null) {
            setError('Invalid event ID.');
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        setLoading(true);

        (async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
                    credentials: 'include',
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`HTTP status: ${response.status}`);
                const data = await response.json();
                setEvent(data);
                setError(null);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch event details:', err);
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [eventId]);

    // [Person 4] Fetch event status (Upcoming/Ongoing/Ended)
    useEffect(() => {
        if (eventId == null) return;
        const controller = new AbortController();

        (async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/status`, {
                    credentials: 'include',
                    signal: controller.signal,
                });
                if (!response.ok) return;
                const data = await response.json();
                setStatus(data.status);
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Failed to fetch event status:', err);
            }
        })();

        return () => controller.abort();
    }, [eventId]);

    // [Person 2] Fetch interested status for this user/event (cookie-based identity)
    useEffect(() => {
        if (eventId == null) return;
        const controller = new AbortController();
        const reqId = ++interestedReqIdRef.current;

        (async () => {
            try {
                const resp = await fetch(`${API_BASE_URL}/api/interested/status/${eventId}`, {
                    credentials: 'include',
                    signal: controller.signal,
                });
                if (!resp.ok) return;
                const json = await resp.json();
                if (reqId === interestedReqIdRef.current) {
                    setIsInterested(Boolean(json.interested));
                }
            } catch (e) {
                if (e.name !== 'AbortError') console.error('Failed to fetch interested status:', e);
            }
        })();

        return () => controller.abort();
    }, [eventId]);

    // [Person 3] Utility: format start/end times for display
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

    // [Person 1] Carousel controls
    const goToNextImage = () => {
        if (event?.event_photos?.length > 1) {
            setCurrentImageIndex((prev) =>
                prev === event.event_photos.length - 1 ? 0 : prev + 1
            );
        }
    };

    const goToPrevImage = () => {
        if (event?.event_photos?.length > 1) {
            setCurrentImageIndex((prev) =>
                prev === 0 ? event.event_photos.length - 1 : prev - 1
            );
        }
    };

    // [Person 4] Share button helpers (UI-only feedback hook)
    const showUiMessage = (message) => {
        // Plug your toast/snackbar here if needed
        console.log(message);
    };

    // [Person 4] Handle Share (Web Share API or clipboard fallback)
    const handleShare = async () => {
        if (!event) {
            showUiMessage('Cannot share, event data is missing.');
            return;
        }

        const shareData = {
            title: event.event_title || "Check out this Event!",
            text: `Join us for: ${event.event_title} happening in ${event.location}!`,
            url: window.location.href, // deep link to this event
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing via Web Share API:', error);
                    showUiMessage('Sharing failed.');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                showUiMessage('Event link copied to clipboard!');
            } catch (err) {
                try {
                    const tempInput = document.createElement('textarea');
                    tempInput.value = shareData.url;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    showUiMessage('Event link copied to clipboard!');
                } catch (fallbackErr) {
                    console.error('Final copy fallback failed:', fallbackErr);
                    showUiMessage('Could not share or copy link.');
                }
            }
        }
    };

    // [Person 1] Carousel helper
    const goToImage = (index) => setCurrentImageIndex(index);
    // [Person 3] Description expand/collapse (mobile)
    const toggleDescription = () => setIsDescriptionExpanded((v) => !v);

    // [Person 2] Interested toggle (optimistic UI + rollback on error)
    const handleToggleInterested = async () => {
        if (!event || interestPending || eventId == null) return;
        setInterestPending(true);

        const prevInterested = isInterested;
        const prevCount = Number(event.interested_count) || 0;
        const nextInterested = !prevInterested;
        const nextCount = Math.max(prevCount + (nextInterested ? 1 : -1), 0);

        setIsInterested(nextInterested);
        setEvent((e) => (e ? { ...e, interested_count: nextCount } : e));

        const reqId = ++interestedReqIdRef.current;

        try {
            if (nextInterested) {
                const resp = await fetch(`${API_BASE_URL}/api/interested`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ event_id: eventId }),
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const json = await resp.json().catch(() => null);

                if (reqId === interestedReqIdRef.current && json?.interested_count != null) {
                    setEvent((e) => (e ? { ...e, interested_count: json.interested_count } : e));
                }
            } else {
                const resp = await fetch(`${API_BASE_URL}/api/interested`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ event_id: eventId }),
                });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const json = await resp.json().catch(() => null);

                if (reqId === interestedReqIdRef.current && json?.interested_count != null) {
                    setEvent((e) => (e ? { ...e, interested_count: json.interested_count } : e));
                }
            }
        } catch (err) {
            console.error('Failed to toggle interested:', err);
            if (reqId === interestedReqIdRef.current) {
                setIsInterested(prevInterested);
                setEvent((e) => (e ? { ...e, interested_count: prevCount } : e));
                alert('Sorry, something went wrong. Please try again.');
            }
        } finally {
            if (reqId === interestedReqIdRef.current) {
                setInterestPending(false);
            }
        }
    };

    // [Shared] Loading / error / not found states
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

    // [Person 3] Compute date range for details section
    const startDate = formatDate(event.start_time);
    const endDate = formatDate(event.end_time);
    const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'N/A';

    return (
        <div className="event-detail-container">
            {/* [Shared] Mobile Navigation Bar */}
            <div className="mobile-nav-bar">
                <Link to="/" className="mobile-back-button">
                    <img src={ArrowLeftIcon} alt="Back" className="mobile-back-icon" />
                </Link>
                <h2 className="mobile-nav-title">Details</h2>
                <div className="mobile-nav-spacer"></div>
            </div>

            <div className="event-content">
                <div className="event-left-section">
                    {/* [Shared] Desktop back */}
                    <Link to="/" className="back-button">
                        <img src={ArrowLeftIcon} alt="Back" className="back-icon" />
                        Back
                    </Link>

                    {/* [Person 3] Event title + description */}
                    <div className="event-header">
                        <div className="event-title-row">
                            <h1 className="event-title">{event.event_title}</h1>
                            {/* [Person 4] Status badge */}
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
                            <button className="description-toggle" onClick={toggleDescription}>
                                {isDescriptionExpanded ? 'Less' : 'More'}
                            </button>
                        </div>
                    </div>

                    {/* [Person 2] Interested button */}
                    <button
                        className={`interested-button ${isInterested ? 'active' : ''}`}
                        onClick={handleToggleInterested}
                        disabled={interestPending}
                        aria-pressed={isInterested}
                    >
                        <img src={StarIcon} alt="" className="interested-icon" />
                        Interested
                    </button>

                    {/* [Person 3] Event details (time, venue, interested count display) */}
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
                                <div className="detail-value">
                                    {Number(event.interested_count) || 0} People Interested
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* [Person 2] Rate Event button (navigation to Rate page only) */}
                    <Link to={`/events/${eventId}/feedback`} className="rate-button">
                        <img src={RateIcon} alt="Rate" className="rate-icon" />
                        Rate Event
                    </Link>

                    {/* [Person 4] Share button */}
                    <button
                        onClick={handleShare}
                        className="share-button"
                    >
                        <Share2 className="w-5 h-5 mr-3" />
                        Share Event
                    </button>
                </div>

                {/* [Person 1] Photo carousel */}
                {event.event_photos && event.event_photos.length > 0 ? (
                    <div className="photo-carousel">
                        <div className={`carousel-container ${event.event_photos.length === 1 ? 'single-image' : ''}`}>
                            <div
                                className="carousel-track"
                                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
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
                    <div className="no-image-placeholder">No Image Found</div>
                )}
            </div>
        </div>
    );
}
