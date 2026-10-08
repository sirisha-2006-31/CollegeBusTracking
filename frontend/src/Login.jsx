import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    // Always start empty
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Please enter email and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email: email,
                    password: password,
                }
            );

            console.log("Login successful:", response.data);

            // Save login information only after successful login
            if (response.data.token) {
                localStorage.setItem(
                    "token",
                    response.data.token
                );
            }

            if (response.data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );
            }

            // Clear form after successful login
            setEmail("");
            setPassword("");

            // Go based on role
            if (response.data.user?.role === "admin") {
                navigate("/admin");
            } else if (
                response.data.user?.role === "driver"
            ) {
                navigate("/driver");
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error("Login error:", err);

            if (err.response?.data?.message) {
                setError(err.response.data.message);
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
                <h2 style={styles.title}>
                    🔐 Login
                </h2>

                <form
                    onSubmit={handleLogin}
                    autoComplete="off"
                >
                    {/* EMAIL */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            autoComplete="off"
                            name="login-email"
                            style={styles.input}
                        />
                    </div>

                    {/* PASSWORD */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            autoComplete="new-password"
                            name="login-password"
                            style={styles.input}
                        />
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div style={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* LOGIN BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>
                </form>

                <p style={styles.registerText}>
                    Don't have an account?
                </p>

                <button
                    onClick={() => navigate("/register")}
                    style={styles.registerButton}
                >
                    Create Account
                </button>
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
    },

    card: {
        width: "100%",
        maxWidth: "420px",
        padding: "30px",
        borderRadius: "12px",
        background: "#ffffff",
        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    },

    title: {
        textAlign: "center",
        marginBottom: "25px",
    },

    inputGroup: {
        marginBottom: "18px",
    },

    label: {
        display: "block",
        marginBottom: "7px",
        fontWeight: "bold",
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
        marginTop: "20px",
        marginBottom: "8px",
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
};

export default Login;