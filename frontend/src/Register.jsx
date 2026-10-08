import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();

    // Always start with empty fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        // Validation
        if (!name || !email || !password || !role) {
            setError("Please fill all fields.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    name: name,
                    email: email,
                    password: password,
                    role: role,
                }
            );

            console.log(
                "Registration successful:",
                response.data
            );

            setSuccess(
                "Registration successful! You can now login."
            );

            // Clear all fields after successful registration
            setName("");
            setEmail("");
            setPassword("");
            setRole("");

        } catch (err) {
            console.error("Registration error:", err);

            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError(
                    "Registration failed. Please try again."
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
                    📝 Register
                </h2>

                <form
                    onSubmit={handleRegister}
                    autoComplete="off"
                >
                    {/* NAME */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            Name
                        </label>

                        <input
                            type="text"
                            name="register-name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            placeholder="Enter your name"
                            autoComplete="off"
                            style={styles.input}
                        />
                    </div>

                    {/* EMAIL */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            Email
                        </label>

                        <input
                            type="email"
                            name="register-email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            autoComplete="off"
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
                            name="register-password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            autoComplete="new-password"
                            style={styles.input}
                        />
                    </div>

                    {/* ROLE */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>
                            Role
                        </label>

                        <select
                            name="register-role"
                            value={role}
                            onChange={(e) =>
                                setRole(e.target.value)
                            }
                            style={styles.select}
                        >
                            <option value="">
                                Select role
                            </option>

                            <option value="student">
                                Student
                            </option>

                            <option value="driver">
                                Driver
                            </option>

                            <option value="admin">
                                Admin
                            </option>
                        </select>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div style={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                        <div style={styles.success}>
                            {success}
                        </div>
                    )}

                    {/* REGISTER BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading
                            ? "Registering..."
                            : "Register"}
                    </button>
                </form>

                <p style={styles.loginText}>
                    Already have an account?
                </p>

                <button
                    onClick={() => navigate("/login")}
                    style={styles.loginButton}
                >
                    Login
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

    select: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        fontSize: "16px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        background: "white",
    },

    error: {
        background: "#ffe0e0",
        color: "#b00020",
        padding: "10px",
        borderRadius: "6px",
        marginBottom: "15px",
    },

    success: {
        background: "#e0ffe5",
        color: "#087f23",
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

    loginText: {
        textAlign: "center",
        marginTop: "20px",
        marginBottom: "8px",
    },

    loginButton: {
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

export default Register;