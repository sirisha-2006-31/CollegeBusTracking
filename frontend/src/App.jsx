
import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    Navigate,
    useNavigate,
} from "react-router-dom";

import StudentTracking from "./StudentTracking";
import DriverGPS from "./DriverGPS";
import Register from "./Register";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";

function Welcome() {
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.heading}>
                    🎓 College Bus Tracking
                </h1>

                <p style={styles.welcomeText}>
                    Welcome to College Bus Tracking!
                </p>

                <p style={styles.description}>
                    Register or log into view live bus locations and arrival times.
                </p>

                <Link to="/register" style={styles.registerButton}>
                    📝 Register - New User
                </Link>

                <Link to="/login" style={styles.loginButton}>
                    🔐 Login - Existing User
                </Link>

                <Link to="/admin" style={styles.adminButton}>
                    🛠️ Admin Dashboard
                </Link>
            </div>
        </div>
    );
}

function ProtectedStudentTracking() {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return <StudentTracking />;
}

function Navigation() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
    }

    return (
        <nav style={styles.nav}>
            <Link to="/" style={styles.navLink}>
                🏠 Home
            </Link>

            {!token && (
                <>
                    <Link to="/register" style={styles.navLink}>
                        📝 Register
                    </Link>
                    <Link to="/login" style={styles.navLink}>
                        🔐 Login
                    </Link>
                </>
            )}

            {token && user.role === "admin" && (
                <Link to="/admin" style={styles.navLink}>
                    🛠️ Admin
                </Link>
            )}

            {token && user.role === "driver" && (
                <Link to="/driver" style={styles.navLink}>
                    📍 Driver GPS
                </Link>
            )}

            {token &&
                (user.role === "student" || user.role === "parent") && (
                    <Link to="/student" style={styles.navLink}>
                        🗺️ Tracking
                    </Link>
                )}

            {token && (
                <button onClick={logout} style={styles.logoutButton}>
                    Logout
                </button>
            )}
        </nav>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Navigation />

            <Routes>
                <Route path="/" element={<Welcome />} />

                <Route
                    path="/student"
                    element={<ProtectedStudentTracking />}
                />

                <Route path="/driver" element={<DriverGPS />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

const styles = {
    nav: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        padding: "15px",
        background: "#1e3a8a",
    },

    navLink: {
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "14px",
    },

    logoutButton: {
        padding: "8px 14px",
        background: "#dc2626",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
    },

    container: {
        minHeight: "85vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        background: "#f1f5f9",
    },

    card: {
        width: "100%",
        maxWidth: "430px",
        boxSizing: "border-box",
        padding: "32px 20px",
        borderRadius: "14px",
        background: "#ffffff",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        textAlign: "center",
    },

    heading: {
        color: "#1e3a8a",
        fontSize: "clamp(18px, 5.5vw, 25px)",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        letterSpacing: "-0.8px",
        margin: "0 0 18px 0",
    },

    welcomeText: {
        color: "#475569",
        fontSize: "14px",
        marginBottom: "12px",
    },

    description: {
        color: "#475569",
        fontSize: "13px",
        lineHeight: "1.6",
        marginBottom: "22px",
    },

    registerButton: {
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        margin: "12px auto",
        padding: "13px 8px",
        borderRadius: "7px",
        background: "#2563eb",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "13px",
    },

    loginButton: {
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        margin: "12px auto",
        padding: "13px 8px",
        borderRadius: "7px",
        background: "#15803d",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "13px",
    },

    adminButton: {
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        margin: "12px auto 0",
        padding: "13px 8px",
        borderRadius: "7px",
        background: "#7c3aed",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "13px",
    },
};

export default App;