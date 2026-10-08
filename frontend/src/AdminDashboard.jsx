import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function AdminDashboard() {
    const navigate = useNavigate();

    const [buses, setBuses] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [busStops, setBusStops] = useState([]);

    const [activeSection, setActiveSection] = useState("dashboard");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // --------------------------------------------------
    // Check admin login
    // --------------------------------------------------
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userString = localStorage.getItem("user");

        if (!token) {
            navigate("/login");
            return;
        }

        if (userString) {
            try {
                const user = JSON.parse(userString);

                if (user.role !== "admin") {
                    navigate("/");
                    return;
                }
            } catch (err) {
                console.error("User data error:", err);
                navigate("/login");
                return;
            }
        }

        loadAllData();
    }, [navigate]);

    // --------------------------------------------------
    // Get authorization header
    // --------------------------------------------------
    const getConfig = () => {
        const token = localStorage.getItem("token");

        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    };

    // --------------------------------------------------
    // Load all data
    // --------------------------------------------------
    const loadAllData = async () => {
        try {
            setLoading(true);
            setError("");

            const config = getConfig();

            const [
                busesResponse,
                driversResponse,
                routesResponse,
                stopsResponse,
            ] = await Promise.all([
                axios.get(`${API_URL}/api/buses`),
                axios.get(`${API_URL}/api/drivers`, config),
                axios.get(`${API_URL}/api/routes`),
                axios.get(`${API_URL}/api/bus-stops`),
            ]);

            setBuses(busesResponse.data || []);
            setDrivers(driversResponse.data || []);
            setRoutes(routesResponse.data || []);
            setBusStops(stopsResponse.data || []);
        } catch (err) {
            console.error("Dashboard error:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to load dashboard data."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // Logout
    // --------------------------------------------------
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    // --------------------------------------------------
    // Delete Bus
    // --------------------------------------------------
    const deleteBus = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this bus?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await axios.delete(
                `${API_URL}/api/buses/${id}`,
                getConfig()
            );

            alert("Bus deleted successfully.");

            loadAllData();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Unable to delete bus."
            );
        }
    };

    // --------------------------------------------------
    // Delete Driver
    // --------------------------------------------------
    const deleteDriver = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this driver?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await axios.delete(
                `${API_URL}/api/drivers/${id}`,
                getConfig()
            );

            alert("Driver deleted successfully.");

            loadAllData();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Unable to delete driver."
            );
        }
    };

    // --------------------------------------------------
    // Delete Route
    // --------------------------------------------------
    const deleteRoute = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this route?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await axios.delete(
                `${API_URL}/api/routes/${id}`,
                getConfig()
            );

            alert("Route deleted successfully.");

            loadAllData();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Unable to delete route."
            );
        }
    };

    // --------------------------------------------------
    // Delete Bus Stop
    // --------------------------------------------------
    const deleteBusStop = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this bus stop?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await axios.delete(
                `${API_URL}/api/bus-stops/${id}`,
                getConfig()
            );

            alert("Bus stop deleted successfully.");

            loadAllData();
        } catch (err) {
            console.error(err);

            alert(
                err.response?.data?.message ||
                "Unable to delete bus stop."
            );
        }
    };

    // --------------------------------------------------
    // Get route name
    // --------------------------------------------------
    const getRouteName = (route) => {
        if (!route) {
            return "Not assigned";
        }

        if (typeof route === "object") {
            return route.routeName || "Unknown route";
        }

        const foundRoute = routes.find(
            (item) => item._id === route
        );

        return foundRoute?.routeName || "Unknown route";
    };

    // --------------------------------------------------
    // Get bus name
    // --------------------------------------------------
    const getBusName = (bus) => {
        if (!bus) {
            return "Not assigned";
        }

        if (typeof bus === "object") {
            return (
                bus.busNumber ||
                bus.busName ||
                "Unknown bus"
            );
        }

        const foundBus = buses.find(
            (item) => item._id === bus
        );

        return (
            foundBus?.busNumber ||
            foundBus?.busName ||
            "Unknown bus"
        );
    };

    // --------------------------------------------------
    // Dashboard
    // --------------------------------------------------
    const renderDashboard = () => {
        return (
            <>
                <h1>🚌 College Bus Admin Dashboard</h1>

                <h3>Welcome Admin</h3>

                <div style={styles.statsGrid}>
                    <div
                        style={styles.statCard}
                        onClick={() =>
                            setActiveSection("buses")
                        }
                    >
                        <div style={styles.icon}>
                            🚌
                        </div>

                        <h3>Total Buses</h3>

                        <h1>{buses.length}</h1>

                        <p>Click to view buses</p>
                    </div>

                    <div
                        style={styles.statCard}
                        onClick={() =>
                            setActiveSection("drivers")
                        }
                    >
                        <div style={styles.icon}>
                            👨‍✈️
                        </div>

                        <h3>Total Drivers</h3>

                        <h1>{drivers.length}</h1>

                        <p>Click to view drivers</p>
                    </div>

                    <div
                        style={styles.statCard}
                        onClick={() =>
                            setActiveSection("routes")
                        }
                    >
                        <div style={styles.icon}>
                            🛣️
                        </div>

                        <h3>Total Routes</h3>

                        <h1>{routes.length}</h1>

                        <p>Click to view routes</p>
                    </div>

                    <div
                        style={styles.statCard}
                        onClick={() =>
                            setActiveSection("stops")
                        }
                    >
                        <div style={styles.icon}>
                            🚏
                        </div>

                        <h3>Total Bus Stops</h3>

                        <h1>{busStops.length}</h1>

                        <p>Click to view bus stops</p>
                    </div>
                </div>
            </>
        );
    };

    // --------------------------------------------------
    // BUSES
    // --------------------------------------------------
    const renderBuses = () => {
        return (
            <div>
                <div style={styles.sectionHeader}>
                    <h2>🚌 Buses ({buses.length})</h2>

                    <button
                        style={styles.backButton}
                        onClick={() =>
                            setActiveSection("dashboard")
                        }
                    >
                        ← Dashboard
                    </button>
                </div>

                {buses.length === 0 ? (
                    <p>No buses found.</p>
                ) : (
                    <div style={styles.listGrid}>
                        {buses.map((bus) => (
                            <div
                                key={bus._id}
                                style={styles.itemCard}
                            >
                                <h3>
                                    🚌 {bus.busNumber}
                                </h3>

                                <p>
                                    <strong>
                                        Bus Name:
                                    </strong>{" "}
                                    {bus.busName}
                                </p>

                                <p>
                                    <strong>
                                        Capacity:
                                    </strong>{" "}
                                    {bus.capacity}
                                </p>

                                <p>
                                    <strong>
                                        Status:
                                    </strong>{" "}
                                    <span
                                        style={{
                                            color:
                                                bus.status ===
                                                "active"
                                                    ? "green"
                                                    : "red",
                                            fontWeight:
                                                "bold",
                                        }}
                                    >
                                        {bus.status}
                                    </span>
                                </p>

                                <p>
                                    <strong>
                                        Route:
                                    </strong>{" "}
                                    {getRouteName(
                                        bus.route
                                    )}
                                </p>

                                <div
                                    style={
                                        styles.buttonRow
                                    }
                                >
                                    <button
                                        style={
                                            styles.editButton
                                        }
                                        onClick={() =>
                                            alert(
                                                "Use the Bus CRUD section to edit this bus."
                                            )
                                        }
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        style={
                                            styles.deleteButton
                                        }
                                        onClick={() =>
                                            deleteBus(
                                                bus._id
                                            )
                                        }
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // --------------------------------------------------
    // DRIVERS
    // --------------------------------------------------
    const renderDrivers = () => {
        return (
            <div>
                <div style={styles.sectionHeader}>
                    <h2>
                        👨‍✈️ Drivers ({drivers.length})
                    </h2>

                    <button
                        style={styles.backButton}
                        onClick={() =>
                            setActiveSection("dashboard")
                        }
                    >
                        ← Dashboard
                    </button>
                </div>

                {drivers.length === 0 ? (
                    <p>No drivers found.</p>
                ) : (
                    <div style={styles.listGrid}>
                        {drivers.map((driver) => {
                            const user =
                                driver.user || driver;

                            return (
                                <div
                                    key={driver._id}
                                    style={
                                        styles.itemCard
                                    }
                                >
                                    <h3>
                                        👨‍✈️{" "}
                                        {user.name ||
                                            driver.name ||
                                            "Driver"}
                                    </h3>

                                    <p>
                                        <strong>
                                            Email:
                                        </strong>{" "}
                                        {user.email ||
                                            driver.email ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Bus:
                                        </strong>{" "}
                                        {getBusName(
                                            driver.bus
                                        )}
                                    </p>

                                    <p>
                                        <strong>
                                            Driver ID:
                                        </strong>{" "}
                                        {driver._id}
                                    </p>

                                    <div
                                        style={
                                            styles.buttonRow
                                        }
                                    >
                                        <button
                                            style={
                                                styles.editButton
                                            }
                                            onClick={() =>
                                                alert(
                                                    "Use the Driver CRUD section to edit this driver."
                                                )
                                            }
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            style={
                                                styles.deleteButton
                                            }
                                            onClick={() =>
                                                deleteDriver(
                                                    driver._id
                                                )
                                            }
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // --------------------------------------------------
    // ROUTES
    // --------------------------------------------------
    const renderRoutes = () => {
        return (
            <div>
                <div style={styles.sectionHeader}>
                    <h2>
                        🛣️ Routes ({routes.length})
                    </h2>

                    <button
                        style={styles.backButton}
                        onClick={() =>
                            setActiveSection("dashboard")
                        }
                    >
                        ← Dashboard
                    </button>
                </div>

                {routes.length === 0 ? (
                    <p>No routes found.</p>
                ) : (
                    <div style={styles.listGrid}>
                        {routes.map((route) => (
                            <div
                                key={route._id}
                                style={styles.itemCard}
                            >
                                <h3>
                                    🛣️{" "}
                                    {route.routeName}
                                </h3>

                                <p>
                                    <strong>
                                        From:
                                    </strong>{" "}
                                    {route.startPoint}
                                </p>

                                <p>
                                    <strong>
                                        To:
                                    </strong>{" "}
                                    {route.endPoint}
                                </p>

                                <p>
                                    <strong>
                                        Stops:
                                    </strong>
                                </p>

                                <ol>
                                    {(
                                        route.stops || []
                                    ).map(
                                        (
                                            stop,
                                            index
                                        ) => (
                                            <li
                                                key={
                                                    index
                                                }
                                            >
                                                {stop}
                                            </li>
                                        )
                                    )}
                                </ol>

                                <div
                                    style={
                                        styles.buttonRow
                                    }
                                >
                                    <button
                                        style={
                                            styles.editButton
                                        }
                                        onClick={() =>
                                            alert(
                                                "Use the Route CRUD section to edit this route."
                                            )
                                        }
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        style={
                                            styles.deleteButton
                                        }
                                        onClick={() =>
                                            deleteRoute(
                                                route._id
                                            )
                                        }
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // --------------------------------------------------
    // BUS STOPS
    // --------------------------------------------------
    const renderStops = () => {
        return (
            <div>
                <div style={styles.sectionHeader}>
                    <h2>
                        🚏 Bus Stops ({busStops.length})
                    </h2>

                    <button
                        style={styles.backButton}
                        onClick={() =>
                            setActiveSection("dashboard")
                        }
                    >
                        ← Dashboard
                    </button>
                </div>

                {busStops.length === 0 ? (
                    <p>No bus stops found.</p>
                ) : (
                    <div style={styles.listGrid}>
                        {busStops.map((stop) => (
                            <div
                                key={stop._id}
                                style={styles.itemCard}
                            >
                                <h3>
                                    🚏{" "}
                                    {stop.stopName}
                                </h3>

                                <p>
                                    <strong>
                                        Latitude:
                                    </strong>{" "}
                                    {stop.latitude}
                                </p>

                                <p>
                                    <strong>
                                        Longitude:
                                    </strong>{" "}
                                    {stop.longitude}
                                </p>

                                <p>
                                    <strong>
                                        Route:
                                    </strong>{" "}
                                    {getRouteName(
                                        stop.route
                                    )}
                                </p>

                                <div
                                    style={
                                        styles.buttonRow
                                    }
                                >
                                    <button
                                        style={
                                            styles.editButton
                                        }
                                        onClick={() =>
                                            alert(
                                                "Use the Bus Stop CRUD section to edit this stop."
                                            )
                                        }
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        style={
                                            styles.deleteButton
                                        }
                                        onClick={() =>
                                            deleteBusStop(
                                                stop._id
                                            )
                                        }
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // --------------------------------------------------
    // MAIN RENDER
    // --------------------------------------------------
    if (loading) {
        return (
            <div style={styles.loading}>
                <h2>Loading Admin Dashboard...</h2>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* TOP BAR */}
            <div style={styles.topBar}>
                <div>
                    <strong>
                        🚌 College Bus Tracking
                    </strong>
                </div>

                <button
                    style={styles.logoutButton}
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            {/* CONTENT */}
            <div style={styles.content}>
                {activeSection === "dashboard" &&
                    renderDashboard()}

                {activeSection === "buses" &&
                    renderBuses()}

                {activeSection === "drivers" &&
                    renderDrivers()}

                {activeSection === "routes" &&
                    renderRoutes()}

                {activeSection === "stops" &&
                    renderStops()}
            </div>
        </div>
    );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
    },

    topBar: {
        background: "#1976d2",
        color: "white",
        padding: "15px 25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    content: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 20px",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
        marginTop: "30px",
    },

    statCard: {
        background: "white",
        borderRadius: "12px",
        padding: "25px",
        textAlign: "center",
        boxShadow:
            "0 3px 10px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "transform 0.2s",
    },

    icon: {
        fontSize: "40px",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
    },

    listGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
    },

    itemCard: {
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow:
            "0 3px 10px rgba(0,0,0,0.1)",
    },

    buttonRow: {
        display: "flex",
        gap: "10px",
        marginTop: "20px",
    },

    editButton: {
        padding: "9px 15px",
        border: "none",
        borderRadius: "6px",
        background: "#1976d2",
        color: "white",
        cursor: "pointer",
    },

    deleteButton: {
        padding: "9px 15px",
        border: "none",
        borderRadius: "6px",
        background: "#d32f2f",
        color: "white",
        cursor: "pointer",
    },

    backButton: {
        padding: "10px 18px",
        border: "none",
        borderRadius: "6px",
        background: "#555",
        color: "white",
        cursor: "pointer",
    },

    logoutButton: {
        padding: "9px 18px",
        border: "none",
        borderRadius: "6px",
        background: "white",
        color: "#1976d2",
        cursor: "pointer",
        fontWeight: "bold",
    },

    error: {
        margin: "20px",
        padding: "15px",
        background: "#ffe0e0",
        color: "#b00020",
        borderRadius: "8px",
    },

    loading: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
    },
};

export default AdminDashboard;