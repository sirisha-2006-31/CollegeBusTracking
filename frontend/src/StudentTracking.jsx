import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline
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

function StudentTracking() {

    // --------------------------------------------------
    // Notification permission
    // --------------------------------------------------
    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    // --------------------------------------------------
    // Send browser notification
    // --------------------------------------------------
    const sendNotification = (title, message) => {
        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {
            new Notification(title, {
                body: message
            });
        }
    };

    const [buses, setBuses] = useState([]);
    const [busStops, setBusStops] = useState([]);

    // Nothing selected when page opens/refreshed
    const [selectedBus, setSelectedBus] = useState("");
    const [selectedStop, setSelectedStop] = useState("");

    const [currentBus, setCurrentBus] = useState(null);
    const [busLocation, setBusLocation] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Prevent repeated notifications
    const notificationSentRef = useRef({
        fiveMinute: false,
        arriving: false
    });

    // --------------------------------------------------
    // Load buses and bus stops
    // --------------------------------------------------
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [busResponse, stopResponse] = await Promise.all([
                    axios.get(`${API_URL}/api/buses`),
                    axios.get(`${API_URL}/api/bus-stops`)
                ]);

                const activeBuses = busResponse.data.filter(
                    (bus) => bus.status === "active"
                );

                setBuses(activeBuses);
                setBusStops(stopResponse.data);

                // Nothing selected automatically
                setSelectedBus("");
                setSelectedStop("");
                setCurrentBus(null);
                setBusLocation(null);

            } catch (err) {
                console.error("Error loading data:", err);
                setError("Unable to load buses and bus stops.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // --------------------------------------------------
    // Find selected bus
    // --------------------------------------------------
    useEffect(() => {
        if (!selectedBus) {
            setCurrentBus(null);
            setBusLocation(null);
            return;
        }

        const bus = buses.find(
            (item) => item.busNumber === selectedBus
        );

        setCurrentBus(bus || null);
        setBusLocation(null);

        // Reset notification status for new bus
        notificationSentRef.current = {
            fiveMinute: false,
            arriving: false
        };

    }, [selectedBus, buses]);

    // --------------------------------------------------
    // Get stops belonging to selected bus route
    // --------------------------------------------------
    const routeStops = useMemo(() => {
        if (!currentBus || !currentBus.route) {
            return [];
        }

        const routeId =
            typeof currentBus.route === "object"
                ? currentBus.route._id
                : currentBus.route;

        return busStops.filter((stop) => {
            const stopRouteId =
                typeof stop.route === "object"
                    ? stop.route._id
                    : stop.route;

            return stopRouteId === routeId;
        });
    }, [currentBus, busStops]);

    // --------------------------------------------------
    // Socket.IO - receive live bus location
    // --------------------------------------------------
    useEffect(() => {
        const socket = io(API_URL, {
            transports: ["websocket"]
        });

        socket.on("busLocation", (location) => {
            console.log("Live bus location received:", location);

            if (!selectedBus) {
                return;
            }

            if (
                location.busId === selectedBus ||
                location.busNumber === selectedBus
            ) {
                setBusLocation(location);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [selectedBus]);

    // --------------------------------------------------
    // When bus changes
    // --------------------------------------------------
    const handleBusChange = (event) => {
        const busNumber = event.target.value;

        setSelectedBus(busNumber);
        setSelectedStop("");
        setBusLocation(null);

        notificationSentRef.current = {
            fiveMinute: false,
            arriving: false
        };
    };

    // --------------------------------------------------
    // When stop changes
    // --------------------------------------------------
    const handleStopChange = (event) => {
        setSelectedStop(event.target.value);

        // Reset notification status for new stop
        notificationSentRef.current = {
            fiveMinute: false,
            arriving: false
        };
    };

    // --------------------------------------------------
    // Find selected stop
    // --------------------------------------------------
    const selectedStopData = useMemo(() => {
        if (!selectedStop) {
            return null;
        }

        return routeStops.find(
            (stop) => stop.stopName === selectedStop
        );
    }, [selectedStop, routeStops]);

    // --------------------------------------------------
    // Haversine distance
    // --------------------------------------------------
    const calculateDistance = (
        lat1,
        lon1,
        lat2,
        lon2
    ) => {
        const R = 6371;

        const dLat =
            ((lat2 - lat1) * Math.PI) / 180;

        const dLon =
            ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(dLat / 2) *
                Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

        return R * c;
    };

    // --------------------------------------------------
    // Distance to selected stop
    // --------------------------------------------------
    const distance = useMemo(() => {
        if (!busLocation || !selectedStopData) {
            return null;
        }

        const busLat = Number(busLocation.latitude);
        const busLon = Number(busLocation.longitude);

        const stopLat = Number(selectedStopData.latitude);
        const stopLon = Number(selectedStopData.longitude);

        if (
            Number.isNaN(busLat) ||
            Number.isNaN(busLon) ||
            Number.isNaN(stopLat) ||
            Number.isNaN(stopLon)
        ) {
            return null;
        }

        return calculateDistance(
            busLat,
            busLon,
            stopLat,
            stopLon
        );
    }, [busLocation, selectedStopData]);

    // --------------------------------------------------
    // ETA calculation
    // --------------------------------------------------
    const eta = useMemo(() => {
        if (distance === null) {
            return null;
        }

        let speed = Number(busLocation?.speed);

        // Demo/project speed if GPS speed is unavailable
        if (!speed || speed <= 1) {
            speed = 30;
        } else {
            // GPS speed normally comes in m/s
            speed = speed * 3.6;
        }

        const timeHours = distance / speed;
        const timeMinutes = Math.round(timeHours * 60);

        if (timeMinutes <= 0) {
            return 1;
        }

        return timeMinutes;
    }, [distance, busLocation]);

    // --------------------------------------------------
    // ETA NOTIFICATIONS
    // --------------------------------------------------
    useEffect(() => {
        if (
            !selectedBus ||
            !selectedStop ||
            eta === null
        ) {
            return;
        }

        // 5-minute warning
        if (
            eta <= 5 &&
            eta > 1 &&
            !notificationSentRef.current.fiveMinute
        ) {
            sendNotification(
                "🚌 Bus Arriving Soon",
                `${selectedBus} will arrive at ${selectedStop} in about ${eta} minutes.`
            );

            notificationSentRef.current.fiveMinute = true;
        }

        // Bus arriving notification
        if (
            eta <= 1 &&
            !notificationSentRef.current.arriving
        ) {
            sendNotification(
                "🚌 Bus Arriving",
                `${selectedBus} is arriving at ${selectedStop}.`
            );

            notificationSentRef.current.arriving = true;
        }

    }, [eta, selectedBus, selectedStop]);

    // --------------------------------------------------
    // Map center
    // --------------------------------------------------
    const mapCenter = useMemo(() => {
        if (busLocation) {
            return [
                Number(busLocation.latitude),
                Number(busLocation.longitude)
            ];
        }

        if (selectedStopData) {
            return [
                Number(selectedStopData.latitude),
                Number(selectedStopData.longitude)
            ];
        }

        // Default Visakhapatnam location
        return [17.6868, 83.2185];

    }, [busLocation, selectedStopData]);

    // --------------------------------------------------
    // Route line
    // --------------------------------------------------
    const routeLine = useMemo(() => {
        if (!routeStops.length) {
            return [];
        }

        return routeStops
            .map((stop) => [
                Number(stop.latitude),
                Number(stop.longitude)
            ])
            .filter(
                (point) =>
                    !Number.isNaN(point[0]) &&
                    !Number.isNaN(point[1])
            );

    }, [routeStops]);

    // --------------------------------------------------
    // Loading screen
    // --------------------------------------------------
    if (loading) {
        return (
            <div style={styles.page}>
                <h1>🎓 Student Live Bus Tracking</h1>
                <p>
                    Loading buses and bus stops...
                </p>
            </div>
        );
    }

    return (
        <div style={styles.page}>

            <h1>
                🎓 Student Live Bus Tracking
            </h1>

            <p style={styles.subtitle}>
                Select your bus and the stop where
                you want to get on.
            </p>

            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            {/* BUS DROPDOWN */}

            <div style={styles.card}>

                <label style={styles.label}>
                    🚌 Bus
                </label>

                <select
                    value={selectedBus}
                    onChange={handleBusChange}
                    style={styles.select}
                >

                    <option value="">
                        Select bus
                    </option>

                    {buses.map((bus) => (
                        <option
                            key={bus._id}
                            value={bus.busNumber}
                        >
                            {bus.busNumber}
                            {bus.busName
                                ? ` - ${bus.busName}`
                                : ""}
                        </option>
                    ))}

                </select>

            </div>

            {/* STOP DROPDOWN */}

            <div style={styles.card}>

                <label style={styles.label}>
                    🚏 Your Stop
                </label>

                <select
                    value={selectedStop}
                    onChange={handleStopChange}
                    disabled={!selectedBus}
                    style={styles.select}
                >

                    <option value="">
                        Select bus stop
                    </option>

                    {routeStops.map((stop) => (
                        <option
                            key={stop._id}
                            value={stop.stopName}
                        >
                            {stop.stopName}
                        </option>
                    ))}

                </select>

                {!selectedBus && (
                    <p style={styles.helpText}>
                        Please select a bus first.
                    </p>
                )}

                {selectedBus &&
                    routeStops.length === 0 && (
                        <p style={styles.warning}>
                            No stops found for this bus route.
                        </p>
                    )}

            </div>

            {/* ROUTE INFORMATION */}

            {selectedBus && currentBus?.route && (
                <div style={styles.routeCard}>

                    <h3>
                        🛣️ Route Information
                    </h3>

                    <p>
                        <strong>Route:</strong>{" "}
                        {currentBus.route.routeName ||
                            "Unknown"}
                    </p>

                    <p>
                        <strong>From:</strong>{" "}
                        {currentBus.route.startPoint ||
                            "Unknown"}
                    </p>

                    <p>
                        <strong>To:</strong>{" "}
                        {currentBus.route.endPoint ||
                            "Unknown"}
                    </p>

                </div>
            )}

            {/* LIVE STATUS */}

            {selectedBus && (
                <div style={styles.statusCard}>

                    {busLocation ? (
                        <>

                            <h2>
                                🟢 Bus is Live
                            </h2>

                            <p>
                                <strong>
                                    Bus ID:
                                </strong>{" "}
                                {selectedBus}
                            </p>

                            {selectedStop && (
                                <p>
                                    <strong>
                                        Your Stop:
                                    </strong>{" "}
                                    {selectedStop}
                                </p>
                            )}

                            {distance !== null && (
                                <p>
                                    📍 Distance:{" "}
                                    <strong>
                                        {distance.toFixed(2)}
                                        {" "}km
                                    </strong>
                                </p>
                            )}

                            {eta !== null && (
                                <p>
                                    ⏱️ ETA:{" "}
                                    <strong>
                                        {eta} minutes
                                    </strong>
                                </p>
                            )}

                        </>
                    ) : (
                        <>

                            <h2>
                                ⏳ Waiting for live location...
                            </h2>

                            <p>
                                Waiting for the driver
                                to start GPS tracking.
                            </p>

                            <p>
                                <strong>
                                    Bus ID:
                                </strong>{" "}
                                {selectedBus}
                            </p>

                        </>
                    )}

                </div>
            )}

            {/* MAP */}

            {selectedBus && (
                <div style={styles.mapSection}>

                    <h2>
                        🗺️ Live Bus Map
                    </h2>

                    <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={styles.map}
                    >

                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Route stops */}

                        {routeStops.map((stop) => (
                            <Marker
                                key={stop._id}
                                position={[
                                    Number(stop.latitude),
                                    Number(stop.longitude)
                                ]}
                            >

                                <Popup>

                                    <strong>
                                        🚏 {stop.stopName}
                                    </strong>

                                </Popup>

                            </Marker>
                        ))}

                        {/* Route line */}

                        {routeLine.length >= 2 && (
                            <Polyline
                                positions={routeLine}
                            />
                        )}

                        {/* Live bus */}

                        {busLocation &&
                            !Number.isNaN(
                                Number(
                                    busLocation.latitude
                                )
                            ) &&
                            !Number.isNaN(
                                Number(
                                    busLocation.longitude
                                )
                            ) && (

                                <Marker
                                    position={[
                                        Number(
                                            busLocation.latitude
                                        ),
                                        Number(
                                            busLocation.longitude
                                        )
                                    ]}
                                >

                                    <Popup>

                                        <strong>
                                            🚌 Live Bus
                                        </strong>

                                        <br />

                                        Bus:{" "}
                                        {selectedBus}

                                        <br />

                                        Latitude:{" "}
                                        {Number(
                                            busLocation.latitude
                                        ).toFixed(5)}

                                        <br />

                                        Longitude:{" "}
                                        {Number(
                                            busLocation.longitude
                                        ).toFixed(5)}

                                    </Popup>

                                </Marker>
                            )}

                    </MapContainer>

                </div>
            )}

            {/* ROUTE STOPS */}

            {selectedBus &&
                routeStops.length > 0 && (

                    <div style={styles.stopsCard}>

                        <h2>
                            🚏 Route Stops
                        </h2>

                        <ol>

                            {routeStops.map((stop) => (
                                <li
                                    key={stop._id}
                                    style={styles.stopItem}
                                >
                                    {stop.stopName}
                                </li>
                            ))}

                        </ol>

                    </div>
                )}

        </div>
    );
}

// --------------------------------------------------
// Styles
// --------------------------------------------------

const styles = {

    page: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "25px",
        fontFamily: "Arial, sans-serif"
    },

    subtitle: {
        color: "#555",
        marginBottom: "25px"
    },

    card: {
        background: "#ffffff",
        padding: "20px",
        marginBottom: "15px",
        borderRadius: "10px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)"
    },

    label: {
        display: "block",
        fontSize: "18px",
        fontWeight: "bold",
        marginBottom: "10px"
    },

    select: {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        background: "#fff"
    },

    helpText: {
        color: "#777",
        marginTop: "8px"
    },

    warning: {
        color: "#b36b00",
        marginTop: "8px"
    },

    error: {
        background: "#ffe0e0",
        color: "#b00020",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "15px"
    },

    routeCard: {
        background: "#eef6ff",
        padding: "20px",
        marginBottom: "15px",
        borderRadius: "10px",
        border: "1px solid #cce0ff"
    },

    statusCard: {
        background: "#f4fff4",
        padding: "20px",
        marginBottom: "20px",
        borderRadius: "10px",
        border: "1px solid #b8e6b8"
    },

    mapSection: {
        marginTop: "25px",
        marginBottom: "25px"
    },

    map: {
        height: "500px",
        width: "100%",
        borderRadius: "10px",
        overflow: "hidden"
    },

    stopsCard: {
        background: "#ffffff",
        padding: "20px",
        marginTop: "20px",
        borderRadius: "10px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)"
    },

    stopItem: {
        padding: "8px",
        fontSize: "16px"
    }
};

export default StudentTracking;