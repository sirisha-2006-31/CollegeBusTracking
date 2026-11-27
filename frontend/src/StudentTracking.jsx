
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
} from "react-leaflet";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_URL = "http://localhost:5000";

// Required routes and stop order
const BUS_ROUTE_CONFIG = {
    BUS001: {
        routeName: "Route 1",
        startPoint: "Gajuwaka",
        endPoint: "Kommadi",
        stopNames: ["Gajuwaka", "NAD", "Gurudwara", "Kommadi"],
    },
    BUS003: {
        routeName: "Route 2",
        startPoint: "MVP Colony",
        endPoint: "Kommadi",
        stopNames: [
            "MVP Colony",
            "Akkayapalem",
            "Madhurawada",
            "Kommadi",
        ],
    },
};

const normalizeName = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

function StudentTracking() {
    const [currentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    });

    const canSubmitFeedback = ["student", "parent"].includes(
        String(currentUser?.role || "").toLowerCase()
    );

    const [buses, setBuses] = useState([]);
    const [busStops, setBusStops] = useState([]);
    const [selectedBus, setSelectedBus] = useState("");
    const [selectedStop, setSelectedStop] = useState("");
    const [busLocation, setBusLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Feedback state
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [existingFeedback, setExistingFeedback] = useState(false);

    // Prevent repeated notifications for the same selection
    const notificationSentRef = useRef({
        fiveMinute: false,
        arriving: false,
    });

    const getFeedbackConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

    // Load the logged-in user's existing feedback
    const loadMyFeedback = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/feedback/mine`,
                getFeedbackConfig()
            );

            const feedback = response.data?.feedback ?? response.data;

            if (
                feedback &&
                typeof feedback === "object" &&
                feedback.rating != null
            ) {
                setRating(Number(feedback.rating));
                setComments(feedback.comments || "");
                setExistingFeedback(true);
            } else {
                setExistingFeedback(false);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error("Unable to load previous feedback:", err);
            }
        }
    };

    // Submit new feedback or update existing feedback
    const submitFeedback = async (event) => {
        event.preventDefault();
        setFeedbackMessage("");

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            setFeedbackMessage("Please select a rating from 1 to 5 stars.");
            return;
        }

        if (comments.length > 1000) {
            setFeedbackMessage("Comments must be 1000 characters or fewer.");
            return;
        }

        setFeedbackLoading(true);

        try {
            await axios.put(
                `${API_URL}/api/feedback`,
                { rating, comments },
                getFeedbackConfig()
            );

            setExistingFeedback(true);
            setFeedbackMessage("Thank you! Your feedback has been saved.");
        } catch (err) {
            setFeedbackMessage(
                err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Unable to submit feedback. Check your login and backend."
            );
        } finally {
            setFeedbackLoading(false);
        }
    };

    // Request browser notification permission
    useEffect(() => {
        if (
            "Notification" in window &&
            Notification.permission === "default"
        ) {
            Notification.requestPermission().catch(() => {});
        }
    }, []);

    // Load previous feedback when the page opens
    useEffect(() => {
        if (localStorage.getItem("token")) {
            loadMyFeedback();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendNotification = (title, message) => {
        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {
            new Notification(title, { body: message });
        }
    };

    // Load only the logged-in student's assigned bus
    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");

                if (!token) {
                    throw new Error(
                        "Please log in before tracking your assigned bus."
                    );
                }

                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                const [assignedResponse, stopResponse] =
                    await Promise.all([
                        axios.get(
                            `${API_URL}/api/students/my-bus`,
                            config
                        ),
                        axios.get(`${API_URL}/api/bus-stops`),
                    ]);

                if (cancelled) return;

                const assignedBus = assignedResponse.data?.bus;

                if (!assignedBus?.busNumber) {
                    throw new Error(
                        "No bus is assigned to your account. Please contact Admin."
                    );
                }

                const stopData = Array.isArray(stopResponse.data)
                    ? stopResponse.data
                    : stopResponse.data?.busStops || [];

                // Students cannot choose a different bus.
                setBuses([assignedBus]);
                setBusStops(stopData);
                setSelectedBus(assignedBus.busNumber);
                setSelectedStop("");
                setBusLocation(null);

                notificationSentRef.current = {
                    fiveMinute: false,
                    arriving: false,
                };
            } catch (err) {
                console.error("Error loading assigned bus:", err);

                if (!cancelled) {
                    setBuses([]);
                    setSelectedBus("");
                    setSelectedStop("");
                    setBusLocation(null);

                    setError(
                        err.response?.data?.message ||
                            err.message ||
                            "Unable to load your assigned bus."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, []);

    const currentBus = useMemo(
        () => buses.find((bus) => bus.busNumber === selectedBus) || null,
        [buses, selectedBus]
    );

    const routeConfig = BUS_ROUTE_CONFIG[selectedBus] || null;

    // Get stops for the assigned bus's route, in the configured order
    const routeStops = useMemo(() => {
        if (!routeConfig) return [];

        const assignedRouteId = currentBus?.route?._id;

        return routeConfig.stopNames.map((name) => {
            const matchingStop = busStops.find((stop) => {
                const stopRouteId = stop.route?._id || stop.route;

                return (
                    normalizeName(stop.stopName) === normalizeName(name) &&
                    (
                        !assignedRouteId ||
                        String(stopRouteId) === String(assignedRouteId)
                    )
                );
            });

            return (
                matchingStop || {
                    _id: `missing-${normalizeName(name).replace(/\s/g, "-")}`,
                    stopName: name,
                    latitude: null,
                    longitude: null,
                    missingCoordinates: true,
                }
            );
        });
    }, [routeConfig, busStops, currentBus]);

    const selectedStopData = useMemo(
        () =>
            routeStops.find(
                (stop) =>
                    normalizeName(stop.stopName) ===
                    normalizeName(selectedStop)
            ) || null,
        [routeStops, selectedStop]
    );

    // Students can choose a stop, but not another bus
    const handleStopChange = (event) => {
        setSelectedStop(event.target.value);

        notificationSentRef.current = {
            fiveMinute: false,
            arriving: false,
        };
    };

    // Receive live GPS location
    useEffect(() => {
        if (!selectedBus) return;

        const socket = io(API_URL, {
            transports: ["websocket", "polling"],
        });

        const handleLocation = (location) => {
            const receivedBusId =
                location.busNumber ??
                location.busId ??
                location.bus?.busNumber ??
                location.bus?.busId;

            if (
                receivedBusId != null &&
                String(receivedBusId) === selectedBus
            ) {
                setBusLocation(location);
            }
        };

        socket.on("busLocation", handleLocation);

        return () => {
            socket.off("busLocation", handleLocation);
            socket.disconnect();
        };
    }, [selectedBus]);

    // Calculate distance using the Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const distance = useMemo(() => {
        if (!busLocation || !selectedStopData) return null;

        const busLat = Number(busLocation.latitude ?? busLocation.lat);
        const busLon = Number(
            busLocation.longitude ?? busLocation.lon ?? busLocation.lng
        );
        const stopLat = Number(selectedStopData.latitude);
        const stopLon = Number(
            selectedStopData.longitude ?? selectedStopData.lon
        );

        if (
            !Number.isFinite(busLat) ||
            !Number.isFinite(busLon) ||
            !Number.isFinite(stopLat) ||
            !Number.isFinite(stopLon)
        ) {
            return null;
        }

        return calculateDistance(busLat, busLon, stopLat, stopLon);
    }, [busLocation, selectedStopData]);

    const eta = useMemo(() => {
        if (distance === null) return null;

        const rawSpeed = Number(busLocation?.speed);
        const speedKmh =
            Number.isFinite(rawSpeed) && rawSpeed > 1
                ? rawSpeed * 3.6
                : 30;

        return Math.max(1, Math.round((distance / speedKmh) * 60));
    }, [distance, busLocation]);

    // Notify the student when the bus is close
    useEffect(() => {
        if (!selectedBus || !selectedStop || eta === null) return;

        if (
            eta <= 5 &&
            eta > 1 &&
            !notificationSentRef.current.fiveMinute
        ) {
            sendNotification(
                "🚌 Bus Arriving Soon",
                `${selectedBus} may reach ${selectedStop} in about ${eta} minutes.`
            );

            notificationSentRef.current.fiveMinute = true;
        }

        if (eta <= 1 && !notificationSentRef.current.arriving) {
            sendNotification(
                "🚌 Bus Arriving",
                `${selectedBus} may be arriving at ${selectedStop}.`
            );

            notificationSentRef.current.arriving = true;
        }
    }, [eta, selectedBus, selectedStop]);

    // Only show stops with valid coordinates on the map
    const validRouteStops = useMemo(
        () =>
            routeStops.filter((stop) => {
                const lat = Number(stop.latitude);
                const lon = Number(stop.longitude ?? stop.lon);

                return (
                    Number.isFinite(lat) &&
                    Number.isFinite(lon) &&
                    lat >= -90 &&
                    lat <= 90 &&
                    lon >= -180 &&
                    lon <= 180
                );
            }),
        [routeStops]
    );

    const routeLine = useMemo(
        () =>
            validRouteStops.map((stop) => [
                Number(stop.latitude),
                Number(stop.longitude ?? stop.lon),
            ]),
        [validRouteStops]
    );

    const busLat = Number(busLocation?.latitude ?? busLocation?.lat);
    const busLon = Number(
        busLocation?.longitude ?? busLocation?.lon ?? busLocation?.lng
    );

    const hasValidBusLocation =
        busLocation &&
        Number.isFinite(busLat) &&
        Number.isFinite(busLon) &&
        busLat >= -90 &&
        busLat <= 90 &&
        busLon >= -180 &&
        busLon <= 180;

    const mapCenter = hasValidBusLocation
        ? [busLat, busLon]
        : validRouteStops.length > 0
          ? [
                Number(validRouteStops[0].latitude),
                Number(validRouteStops[0].longitude ?? validRouteStops[0].lon),
            ]
          : [17.6868, 83.2185];

    if (loading) {
        return (
            <div style={styles.page}>
                <h1>🎓 Student Live Bus Tracking</h1>
                <p>Loading your assigned bus and bus stops...</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <h1>🎓 Student Live Bus Tracking</h1>

            <p style={styles.subtitle}>
                Track your assigned bus and select the stop where you want
                to get on.
            </p>

            {error && <div style={styles.error}>{error}</div>}

            {/* ASSIGNED BUS */}
            <div style={styles.card}>
                <label style={styles.label}>🚌 Your Assigned Bus</label>

                <select
                    value={selectedBus}
                    disabled
                    style={styles.select}
                >
                    {buses.map((bus) => (
                        <option key={bus._id} value={bus.busNumber}>
                            {bus.busNumber}
                            {bus.busName ? ` - ${bus.busName}` : ""}
                        </option>
                    ))}
                </select>

                <p style={styles.helpText}>
                    This bus is assigned to your account. Contact Admin if
                    the assignment is incorrect.
                </p>
            </div>

            {/* STOP SELECTION */}
            <div style={styles.card}>
                <label style={styles.label}>🚏 Your Stop</label>

                <select
                    value={selectedStop}
                    onChange={handleStopChange}
                    disabled={!selectedBus}
                    style={styles.select}
                >
                    <option value="">Select bus stop</option>

                    {routeStops.map((stop) => (
                        <option key={stop._id} value={stop.stopName}>
                            {stop.stopName}
                            {stop.missingCoordinates
                                ? " (stop record missing)"
                                : ""}
                        </option>
                    ))}
                </select>

                {!selectedBus && (
                    <p style={styles.helpText}>
                        Your assigned bus could not be loaded.
                    </p>
                )}

                {selectedBus &&
                    routeStops.some((stop) => stop.missingCoordinates) && (
                        <p style={styles.warning}>
                            Some stops are missing from the database.
                            Their map markers and ETA will not work until
                            the correct stop records and coordinates are added.
                        </p>
                    )}
            </div>

            {/* ROUTE DETAILS */}
            {routeConfig && (
                <div style={styles.routeCard}>
                    <h3>🛣️ Route Information</h3>

                    <p>
                        <strong>Route:</strong> {routeConfig.routeName}
                    </p>
                    <p>
                        <strong>From:</strong> {routeConfig.startPoint}
                    </p>
                    <p>
                        <strong>To:</strong> {routeConfig.endPoint}
                    </p>
                    <p>
                        <strong>Stops:</strong>{" "}
                        {routeConfig.stopNames.join(" → ")}
                    </p>

                    {currentBus?.route &&
                        (
                            normalizeName(currentBus.route.startPoint) !==
                                normalizeName(routeConfig.startPoint) ||
                            normalizeName(currentBus.route.endPoint) !==
                                normalizeName(routeConfig.endPoint)
                        ) && (
                            <p style={styles.warning}>
                                The assigned bus route in MongoDB does not
                                match the expected route. Please check the
                                assignment in the Admin Dashboard.
                            </p>
                        )}
                </div>
            )}

            {/* LIVE STATUS */}
            {selectedBus && (
                <div style={styles.statusCard}>
                    {hasValidBusLocation ? (
                        <>
                            <h2>🟢 Bus is Live</h2>

                            <p>
                                <strong>Bus ID:</strong> {selectedBus}
                            </p>

                            {selectedStop && (
                                <p>
                                    <strong>Your Stop:</strong> {selectedStop}
                                </p>
                            )}

                            {distance !== null && (
                                <p>
                                    📍 Distance:{" "}
                                    <strong>{distance.toFixed(2)} km</strong>
                                </p>
                            )}

                            {selectedStop && eta !== null && (
                                <p>
                                    ⏱️ Estimated arrival:{" "}
                                    <strong>{eta} minutes</strong>
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <h2>⏳ Waiting for live location...</h2>
                            <p>
                                Waiting for the driver to start GPS tracking.
                            </p>
                            <p>
                                <strong>Bus ID:</strong> {selectedBus}
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* LIVE MAP */}
            {selectedBus && (
                <div style={styles.mapSection}>
                    <h2>🗺️ Live Bus Map</h2>

                    <MapContainer
                        key={selectedBus}
                        center={mapCenter}
                        zoom={13}
                        style={styles.map}
                    >
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {validRouteStops.map((stop) => (
                            <Marker
                                key={stop._id}
                                position={[
                                    Number(stop.latitude),
                                    Number(stop.longitude ?? stop.lon),
                                ]}
                            >
                                <Popup>
                                    <strong>🚏 {stop.stopName}</strong>
                                </Popup>
                            </Marker>
                        ))}

                        {routeLine.length >= 2 && (
                            <Polyline positions={routeLine} />
                        )}

                        {hasValidBusLocation && (
                            <Marker position={[busLat, busLon]}>
                                <Popup>
                                    <strong>🚌 Live Bus</strong>
                                    <br />
                                    Bus: {selectedBus}
                                    <br />
                                    Latitude: {busLat.toFixed(5)}
                                    <br />
                                    Longitude: {busLon.toFixed(5)}
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>
            )}

            {/* ORDERED ROUTE STOPS */}
            {selectedBus && routeStops.length > 0 && (
                <div style={styles.stopsCard}>
                    <h2>🚏 Route Stops</h2>

                    <ol>
                        {routeStops.map((stop) => (
                            <li key={stop._id} style={styles.stopItem}>
                                {stop.stopName}

                                {stop.missingCoordinates && (
                                    <span style={styles.warning}>
                                        {" "}(add this stop in MongoDB)
                                    </span>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* STUDENT / PARENT FEEDBACK */}
            {canSubmitFeedback && (
                <div style={styles.feedbackCard}>
                    <h2>⭐ Student & Parent Feedback</h2>
                    <p>Rate your college bus tracking experience.</p>

                    <form onSubmit={submitFeedback}>
                        <label style={styles.label}>
                            Your Rating (required)
                        </label>

                        <div style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                    aria-pressed={rating === star}
                                    style={{
                                        ...styles.starButton,
                                        color:
                                            star <= rating
                                                ? "#f59e0b"
                                                : "#9ca3af",
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <p>
                            {rating > 0
                                ? `${rating} out of 5 stars`
                                : "Select a rating"}
                        </p>

                        <label
                            htmlFor="feedback-comments"
                            style={styles.label}
                        >
                            Comments (optional)
                        </label>

                        <textarea
                            id="feedback-comments"
                            value={comments}
                            onChange={(event) => setComments(event.target.value)}
                            maxLength={1000}
                            placeholder="Share your experience..."
                            rows={4}
                            style={styles.feedbackTextarea}
                        />

                        <p>{comments.length}/1000 characters</p>

                        <button
                            type="submit"
                            disabled={feedbackLoading}
                            style={{
                                ...styles.feedbackButton,
                                opacity: feedbackLoading ? 0.7 : 1,
                            }}
                        >
                            {feedbackLoading
                                ? "Saving..."
                                : existingFeedback
                                  ? "Update Feedback"
                                  : "Submit Feedback"}
                        </button>

                        {feedbackMessage && (
                            <p
                                role="status"
                                style={styles.feedbackMessage}
                            >
                                {feedbackMessage}
                            </p>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "25px",
        fontFamily: "Arial, sans-serif",
    },

    subtitle: {
        color: "#555",
        marginBottom: "25px",
    },

    card: {
        background: "#ffffff",
        padding: "20px",
        marginBottom: "15px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },

    label: {
        display: "block",
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "10px",
    },

    select: {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        background: "#fff",
        boxSizing: "border-box",
    },

    helpText: {
        color: "#777",
        marginTop: "8px",
    },

    warning: {
        color: "#a15c00",
        marginTop: "8px",
    },

    error: {
        background: "#ffe0e0",
        color: "#b00020",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "15px",
    },

    routeCard: {
        background: "#eef6ff",
        padding: "20px",
        marginBottom: "15px",
        borderRadius: "10px",
        border: "1px solid #cce0ff",
    },

    statusCard: {
        background: "#f4fff4",
        padding: "20px",
        marginBottom: "20px",
        borderRadius: "10px",
        border: "1px solid #b8e6b8",
    },

    mapSection: {
        marginTop: "25px",
        marginBottom: "25px",
    },

    map: {
        height: "500px",
        width: "100%",
        borderRadius: "10px",
        overflow: "hidden",
    },

    stopsCard: {
        background: "#ffffff",
        padding: "20px",
        marginTop: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },

    stopItem: {
        padding: "8px",
        fontSize: "16px",
    },

    feedbackCard: {
        background: "#ffffff",
        padding: "20px",
        marginTop: "25px",
        marginBottom: "25px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },

    stars: {
        display: "flex",
        gap: "8px",
        margin: "10px 0",
    },

    starButton: {
        border: "none",
        background: "transparent",
        fontSize: "35px",
        cursor: "pointer",
        padding: "2px",
    },

    feedbackTextarea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        fontSize: "15px",
        resize: "vertical",
    },

    feedbackButton: {
        padding: "12px 20px",
        background: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
    },

    feedbackMessage: {
        marginTop: "12px",
        fontWeight: "bold",
    },
};

export default StudentTracking;
