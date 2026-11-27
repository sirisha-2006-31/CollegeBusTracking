
import React, { useEffect, useState, useCallback } from "react";
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

    const [driverName, setDriverName] = useState("");
    const [driverEmail, setDriverEmail] = useState("");
    const [busNumber, setBusNumber] = useState("BUS001");
    const [assigning, setAssigning] = useState(false);
    const [assignMessage, setAssignMessage] = useState("");
    const [assignError, setAssignError] = useState("");

    const [feedbackList, setFeedbackList] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackError, setFeedbackError] = useState("");
    const [averageRating, setAverageRating] = useState(0);
    const [totalFeedback, setTotalFeedback] = useState(0);

    const getConfig = useCallback(() => {
        const token = localStorage.getItem("token");

        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }, []);

    // Load feedback and update the dashboard count.
    const loadFeedback = useCallback(async () => {
        try {
            setFeedbackLoading(true);
            setFeedbackError("");

            const response = await axios.get(
                `${API_URL}/api/feedback`,
                getConfig()
            );

            const data = response.data;

            const feedback = Array.isArray(data)
                ? data
                : Array.isArray(data?.feedback)
                  ? data.feedback
                  : Array.isArray(data?.feedbacks)
                    ? data.feedbacks
                    : [];

            setFeedbackList(feedback);

            const count = Number(data?.totalFeedback);
            setTotalFeedback(
                Number.isFinite(count) && count >= 0
                    ? count
                    : feedback.length
            );

            const calculatedAverage = feedback.length
                ? feedback.reduce(
                      (total, item) =>
                          total + Number(item.rating || 0),
                      0
                  ) / feedback.length
                : 0;

            setAverageRating(
                Number(data?.averageRating ?? calculatedAverage)
            );
        } catch (err) {
            console.error("Load feedback error:", err);

            setFeedbackError(
                err.response?.data?.message ||
                    "Unable to load feedback. Please check the backend API."
            );
        } finally {
            setFeedbackLoading(false);
        }
    }, [getConfig]);

    const loadAllData = useCallback(async () => {
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

            setBuses(
                Array.isArray(busesResponse.data)
                    ? busesResponse.data
                    : []
            );

            setDrivers(
                Array.isArray(driversResponse.data)
                    ? driversResponse.data
                    : []
            );

            setRoutes(
                Array.isArray(routesResponse.data)
                    ? routesResponse.data
                    : []
            );

            setBusStops(
                Array.isArray(stopsResponse.data)
                    ? stopsResponse.data
                    : []
            );

            // Load feedback at the same time as dashboard data.
            await loadFeedback();
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
    }, [getConfig, loadFeedback, navigate]);

    // Verify login and admin role, then load all dashboard data.
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userString = localStorage.getItem("user");

        if (!token || !userString) {
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(userString);

            if (user.role !== "admin") {
                navigate("/");
                return;
            }
        } catch {
            navigate("/login");
            return;
        }

        loadAllData();
    }, [navigate, loadAllData]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const openSection = (section) => {
        setActiveSection(section);

        if (section === "feedback") {
            loadFeedback();
        }
    };

    const backToDashboard = async () => {
        setActiveSection("dashboard");
        await loadFeedback();
    };

    const handleAssignDriver = async (e) => {
        e.preventDefault();

        setAssignMessage("");
        setAssignError("");

        if (!driverName.trim() || !driverEmail.trim()) {
            setAssignError(
                "Please enter the driver's name and email."
            );
            return;
        }

        try {
            setAssigning(true);

            const response = await axios.post(
                `${API_URL}/api/auth/admin/assign-driver`,
                {
                    name: driverName.trim(),
                    email: driverEmail.trim().toLowerCase(),
                    busNumber,
                },
                getConfig()
            );

            setAssignMessage(
                response.data?.message ||
                    "Bus assigned successfully."
            );

            setDriverName("");
            setDriverEmail("");
            setBusNumber("BUS001");

            await loadAllData();
        } catch (err) {
            console.error("Driver assignment error:", err);

            setAssignError(
                err.response?.data?.message ||
                    "Unable to assign bus. Please check the backend route."
            );
        } finally {
            setAssigning(false);
        }
    };

    const deleteItem = async (type, id, label) => {
        if (!window.confirm(`Are you sure you want to delete this ${label}?`)) {
            return;
        }

        try {
            await axios.delete(
                `${API_URL}/api/${type}/${id}`,
                getConfig()
            );

            alert(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted successfully.`);
            await loadAllData();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                    `Unable to delete ${label}.`
            );
        }
    };

    const deleteBus = (id) => deleteItem("buses", id, "bus");
    const deleteDriver = (id) => deleteItem("drivers", id, "driver");
    const deleteRoute = (id) => deleteItem("routes", id, "route");
    const deleteBusStop = (id) => deleteItem("bus-stops", id, "bus stop");

    const getRouteName = (route) => {
        if (!route) return "Not assigned";

        if (typeof route === "object") {
            return route.routeName || "Unknown route";
        }

        const foundRoute = routes.find((item) => item._id === route);
        return foundRoute?.routeName || "Unknown route";
    };

    const getBusName = (bus) => {
        if (!bus) return "Not assigned";

        if (typeof bus === "object") {
            return bus.busNumber || bus.busName || "Unknown bus";
        }

        const foundBus = buses.find((item) => item._id === bus);
        return foundBus?.busNumber || foundBus?.busName || "Unknown bus";
    };

    const renderDashboard = () => (
        <>
            <h1>🚌 College Bus Admin Dashboard</h1>
            <h3>Welcome Admin</h3>

            <div style={styles.statsGrid}>
                <div style={styles.statCard} onClick={() => openSection("buses")}>
                    <div style={styles.icon}>🚌</div>
                    <h3>Total Buses</h3>
                    <h1>{buses.length}</h1>
                    <p>Click to view buses</p>
                </div>

                <div style={styles.statCard} onClick={() => openSection("drivers")}>
                    <div style={styles.icon}>👨‍✈️</div>
                    <h3>Total Drivers</h3>
                    <h1>{drivers.length}</h1>
                    <p>Click to view drivers</p>
                </div>

                <div style={styles.statCard} onClick={() => openSection("routes")}>
                    <div style={styles.icon}>🛣️</div>
                    <h3>Total Routes</h3>
                    <h1>{routes.length}</h1>
                    <p>Click to view routes</p>
                </div>

                <div style={styles.statCard} onClick={() => openSection("stops")}>
                    <div style={styles.icon}>🚏</div>
                    <h3>Total Bus Stops</h3>
                    <h1>{busStops.length}</h1>
                    <p>Click to view bus stops</p>
                </div>

                <div style={styles.statCard} onClick={() => openSection("assignDriver")}>
                    <div style={styles.icon}>📝</div>
                    <h3>Assign Bus</h3>
                    <p>Assign BUS001 or BUS003 to a driver</p>
                </div>

                <div style={styles.statCard} onClick={() => openSection("feedback")}>
                    <div style={styles.icon}>⭐</div>
                    <h3>Student & Parent Feedback</h3>
                    <h1>{feedbackLoading ? "…" : totalFeedback}</h1>
                    <p>View all ratings and comments</p>
                </div>
            </div>

            {feedbackError && (
                <p style={styles.error}>{feedbackError}</p>
            )}
        </>
    );

    const renderBuses = () => (
        <div>
            <div style={styles.sectionHeader}>
                <h2>🚌 Buses ({buses.length})</h2>
                <button style={styles.backButton} onClick={backToDashboard}>
                    ← Dashboard
                </button>
            </div>

            {buses.length === 0 ? (
                <p>No buses found.</p>
            ) : (
                <div style={styles.listGrid}>
                    {buses.map((bus) => (
                        <div key={bus._id} style={styles.itemCard}>
                            <h3>🚌 {bus.busNumber}</h3>
                            <p><strong>Bus Name:</strong> {bus.busName || "N/A"}</p>
                            <p><strong>Capacity:</strong> {bus.capacity ?? "N/A"}</p>
                            <p>
                                <strong>Status:</strong>{" "}
                                <span style={{
                                    color: bus.status === "active" ? "green" : "red",
                                    fontWeight: "bold",
                                }}>
                                    {bus.status || "Unknown"}
                                </span>
                            </p>
                            <p><strong>Route:</strong> {getRouteName(bus.route)}</p>
                            <div style={styles.buttonRow}>
                                <button style={styles.editButton} onClick={() => alert("Bus editing is not implemented yet.")}>✏️ Edit</button>
                                <button style={styles.deleteButton} onClick={() => deleteBus(bus._id)}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderDrivers = () => (
        <div>
            <div style={styles.sectionHeader}>
                <h2>👨‍✈️ Drivers ({drivers.length})</h2>
                <button style={styles.backButton} onClick={backToDashboard}>
                    ← Dashboard
                </button>
            </div>

            {drivers.length === 0 ? (
                <p>No drivers found.</p>
            ) : (
                <div style={styles.listGrid}>
                    {drivers.map((driver) => {
                        const user = driver.user || driver;

                        return (
                            <div key={driver._id} style={styles.itemCard}>
                                <h3>👨‍✈️ {user.name || driver.name || "Driver"}</h3>
                                <p><strong>Email:</strong> {user.email || driver.email || "N/A"}</p>
                                <p><strong>Bus:</strong> {getBusName(driver.bus)}</p>
                                <p><strong>Driver ID:</strong> {driver._id}</p>
                                <div style={styles.buttonRow}>
                                    <button style={styles.editButton} onClick={() => alert("Driver editing is not implemented yet.")}>✏️ Edit</button>
                                    <button style={styles.deleteButton} onClick={() => deleteDriver(driver._id)}>🗑️ Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderRoutes = () => (
        <div>
            <div style={styles.sectionHeader}>
                <h2>🛣️ Routes ({routes.length})</h2>
                <button style={styles.backButton} onClick={backToDashboard}>
                    ← Dashboard
                </button>
            </div>

            {routes.length === 0 ? (
                <p>No routes found.</p>
            ) : (
                <div style={styles.listGrid}>
                    {routes.map((route) => (
                        <div key={route._id} style={styles.itemCard}>
                            <h3>🛣️ {route.routeName}</h3>
                            <p><strong>From:</strong> {route.startPoint}</p>
                            <p><strong>To:</strong> {route.endPoint}</p>
                            <p><strong>Stops:</strong></p>
                            <ol>
                                {(route.stops || []).map((stop, index) => (
                                    <li key={`${route._id}-${index}`}>{stop}</li>
                                ))}
                            </ol>
                            <div style={styles.buttonRow}>
                                <button style={styles.editButton} onClick={() => alert("Route editing is not implemented yet.")}>✏️ Edit</button>
                                <button style={styles.deleteButton} onClick={() => deleteRoute(route._id)}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderStops = () => (
        <div>
            <div style={styles.sectionHeader}>
                <h2>🚏 Bus Stops ({busStops.length})</h2>
                <button style={styles.backButton} onClick={backToDashboard}>
                    ← Dashboard
                </button>
            </div>

            {busStops.length === 0 ? (
                <p>No bus stops found.</p>
            ) : (
                <div style={styles.listGrid}>
                    {busStops.map((stop) => (
                        <div key={stop._id} style={styles.itemCard}>
                            <h3>🚏 {stop.stopName}</h3>
                            <p><strong>Latitude:</strong> {stop.latitude}</p>
                            <p><strong>Longitude:</strong> {stop.longitude}</p>
                            <p><strong>Route:</strong> {getRouteName(stop.route)}</p>
                            <div style={styles.buttonRow}>
                                <button style={styles.editButton} onClick={() => alert("Bus stop editing is not implemented yet.")}>✏️ Edit</button>
                                <button style={styles.deleteButton} onClick={() => deleteBusStop(stop._id)}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAssignDriver = () => (
        <div>
            <div style={styles.sectionHeader}>
                <h2>📝 Assign Bus to Driver</h2>
                <button style={styles.backButton} onClick={backToDashboard}>
                    ← Dashboard
                </button>
            </div>

            <div style={styles.itemCard}>
                <p>Enter the driver's name and email, then select a bus. The driver must register using the same name and email.</p>

                {assignMessage && <div style={styles.success}>{assignMessage}</div>}
                {assignError && <div style={styles.error}>{assignError}</div>}

                <form onSubmit={handleAssignDriver}>
                    <div style={styles.formGroup}>
                        <label htmlFor="driverName">Driver Name</label>
                        <input id="driverName" type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Enter driver name" required style={styles.input} />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="driverEmail">Driver Email</label>
                        <input id="driverEmail" type="email" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} placeholder="Enter driver email" required style={styles.input} />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="busNumber">Select Bus</label>
                        <select id="busNumber" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} style={styles.input}>
                            <option value="BUS001">BUS001 — Gajuwaka → NAD → Gurudwara → Kommadi</option>
                            <option value="BUS003">BUS003 — MVP Colony → Akkayapalem → Madhurawada → Kommadi</option>
                        </select>
                    </div>

                    <button type="submit" style={{ ...styles.assignButton, opacity: assigning ? 0.7 : 1 }} disabled={assigning}>
                        {assigning ? "Assigning..." : "Assign Bus"}
                    </button>
                </form>
            </div>
        </div>
    );

    const renderFeedback = () => (
        <div>
            <div style={styles.sectionHeader}>
                <h2>⭐ Student & Parent Feedback ({totalFeedback})</h2>
                <div style={styles.buttonRow}>
                    <button style={styles.editButton} onClick={loadFeedback} disabled={feedbackLoading}>
                        {feedbackLoading ? "Loading..." : "↻ Refresh"}
                    </button>
                    <button style={styles.backButton} onClick={backToDashboard}>
                        ← Dashboard
                    </button>
                </div>
            </div>

            {feedbackError && <div style={styles.error}>{feedbackError}</div>}

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <h3>Total Feedback</h3>
                    <h1>{totalFeedback}</h1>
                </div>

                <div style={styles.statCard}>
                    <h3>Average Rating</h3>
                    <h1>{averageRating.toFixed(1)} / 5</h1>
                    <p style={{ color: "#f5a623", fontSize: "24px" }}>
                        {"★".repeat(Math.round(averageRating))}
                        {"☆".repeat(5 - Math.round(averageRating))}
                    </p>
                </div>
            </div>

            {feedbackLoading && feedbackList.length === 0 ? (
                <p>Loading feedback...</p>
            ) : feedbackList.length === 0 ? (
                <p>No feedback has been submitted yet.</p>
            ) : (
                <div style={styles.listGrid}>
                    {feedbackList.map((item) => {
                        const user = item.user && typeof item.user === "object"
                            ? item.user
                            : {};

                        const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));

                        return (
                            <div key={item._id} style={styles.itemCard}>
                                <h3>{user.name || "Unknown User"}</h3>
                                <p><strong>Email:</strong> {user.email || "Not available"}</p>
                                <p><strong>Role:</strong> {item.role || user.role || "Not specified"}</p>
                                <p>
                                    <strong>Rating:</strong>{" "}
                                    <span style={{ color: "#f5a623", fontSize: "22px" }}>
                                        {"★".repeat(rating)}
                                        {"☆".repeat(5 - rating)}
                                    </span>{" "}
                                    ({rating}/5)
                                </p>
                                <p><strong>Comments:</strong></p>
                                <p style={{ whiteSpace: "pre-wrap" }}>
                                    {item.comments?.trim() || "No comments provided."}
                                </p>
                                <p>
                                    <strong>Last updated:</strong>{" "}
                                    {item.updatedAt
                                        ? new Date(item.updatedAt).toLocaleString()
                                        : "Not available"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div style={styles.loading}>
                <h2>Loading Admin Dashboard...</h2>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.topBar}>
                <strong>🚌 College Bus Tracking</strong>
                <button style={styles.logoutButton} onClick={handleLogout}>
                    Logout
                </button>
            </div>

            {error && (
                <div style={styles.error}>
                    {error}
                    <button style={styles.retryButton} onClick={loadAllData}>
                        Retry
                    </button>
                </div>
            )}

            <div style={styles.content}>
                {activeSection === "dashboard" && renderDashboard()}
                {activeSection === "buses" && renderBuses()}
                {activeSection === "drivers" && renderDrivers()}
                {activeSection === "routes" && renderRoutes()}
                {activeSection === "stops" && renderStops()}
                {activeSection === "assignDriver" && renderAssignDriver()}
                {activeSection === "feedback" && renderFeedback()}
            </div>
        </div>
    );
}

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
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "20px",
        marginTop: "30px",
    },

    statCard: {
        background: "white",
        borderRadius: "12px",
        padding: "25px",
        textAlign: "center",
        boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
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
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "25px",
    },

    listGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
    },

    itemCard: {
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    },

    buttonRow: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
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

    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "18px",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        fontSize: "15px",
    },

    assignButton: {
        padding: "12px 20px",
        background: "#1976d2",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
    },

    success: {
        padding: "12px",
        marginBottom: "15px",
        background: "#e8f5e9",
        color: "#2e7d32",
        borderRadius: "6px",
    },

    error: {
        margin: "20px 0",
        padding: "15px",
        background: "#ffe0e0",
        color: "#b00020",
        borderRadius: "8px",
    },

    retryButton: {
        marginLeft: "12px",
        padding: "6px 12px",
        cursor: "pointer",
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
