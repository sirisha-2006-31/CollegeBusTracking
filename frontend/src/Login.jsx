
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    // Start with empty fields every time the page opens
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email: email.trim(),
                    password: password,
                }
            );

            const { token, user } = response.data;

            // Ensure login response contains authentication details
            if (!token || !user) {
                setError(
                    "Login response is incomplete. Please contact the administrator."
                );
                return;
            }

            // Save authentication details after successful login
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // Clear form fields
            setEmail("");
            setPassword("");
            const role = String(user.role || "").trim().toLowerCase();
            // Redirect according to account role
            if (role === "admin") {
                navigate("/admin", { replace: true });
            } else if (role === "driver") {
                navigate("/driver", { replace: true });
            } else if (role === "student" ||role === "parent") {
                navigate("/student", { replace: true });
            } else {
                // Keep compatibility with existing regular user accounts
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setError("Your account role is invalid. Please contact the administrator.");
            }
        } catch (err) {
            console.error("Login error:", err);

            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.status === 401) {
                setError("Invalid email or password.");
            } else {
                setError(
                    "Login failed. Please check your email and password."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>🔐 Login</h2>

                <p style={styles.subtitle}>
                    Students and parents can log in to track their college bus.
                </p>

                <form onSubmit={handleLogin} autoComplete="off">
                    <div style={styles.inputGroup}>
                        <label htmlFor="login-email" style={styles.label}>
                            Email
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            autoComplete="off"
                            name="login-email"
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="login-password" style={styles.label}>
                            Password
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            name="login-password"
                            style={styles.input}
                            required
                        />
                    </div>

                    {error && (
                        <div role="alert" style={styles.error}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p style={styles.registerText}>
                    Don't have an account?
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/register")}
                    style={styles.registerButton}
                >
                    Create Account
                </button>

                <p style={styles.homeText}>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        style={styles.homeButton}
                    >
                        Back to Home
                    </button>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
    },

    card: {
        width: "100%",
        maxWidth: "420px",
        boxSizing: "border-box",
        padding: "30px",
        borderRadius: "12px",
        background: "#ffffff",
        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    },

    title: {
        textAlign: "center",
        marginBottom: "12px",
        color: "#1e3a8a",
    },

    subtitle: {
        textAlign: "center",
        color: "#555",
        marginBottom: "25px",
        lineHeight: 1.5,
    },

    inputGroup: {
        marginBottom: "18px",
    },

    label: {
        display: "block",
        marginBottom: "7px",
        fontWeight: "bold",
        color: "#333",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "1px solid #ccc",
    },

    error: {
        background: "#ffe0e0",
        color: "#b00020",
        padding: "10px",
        borderRadius: "6px",
        marginBottom: "15px",
        lineHeight: 1.5,
    },

    button: {
        width: "100%",
        padding: "12px",
        fontSize: "16px",
        border: "none",
        borderRadius: "6px",
        background: "#1976d2",
        color: "white",
        cursor: "pointer",
    },

    registerText: {
        textAlign: "center",
        marginTop: "22px",
        marginBottom: "10px",
        color: "#444",
    },

    registerButton: {
        width: "100%",
        padding: "10px",
        fontSize: "15px",
        border: "1px solid #1976d2",
        borderRadius: "6px",
        background: "white",
        color: "#1976d2",
        cursor: "pointer",
    },

    homeText: {
        textAlign: "center",
        marginTop: "16px",
        marginBottom: 0,
    },

    homeButton: {
        border: "none",
        background: "transparent",
        color: "#555",
        cursor: "pointer",
        textDecoration: "underline",
        fontSize: "14px",
    },
};

export default Login;