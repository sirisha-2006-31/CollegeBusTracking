import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/auth";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("admin");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    setupKey: "",
    parentName: "",
    parentEmail: "",
    phone: "",
    licenseNumber: "",
    busNumber: "BUS001"
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (
      role === "student" &&
      form.email.trim().toLowerCase() ===
        form.parentEmail.trim().toLowerCase()
    ) {
      setError("Student and parent emails must be different.");
      return;
    }

    setLoading(true);

    try {
      let endpoint;
      let payload;

      if (role === "admin") {
        endpoint = `${API}/admin-register`;
        payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          setupKey: form.setupKey
        };
      } else if (role === "driver") {
        endpoint = `${API}/driver-register`;
        payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          licenseNumber: form.licenseNumber
        };
      } else if (role === "parent") {
        endpoint = `${API}/parent-register`;
        payload = {
          name: form.name,
          email: form.email,
          password: form.password
        };
      } else {
        endpoint = `${API}/register`;
        payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          parentName: form.parentName,
          parentEmail: form.parentEmail,
          busNumber: form.busNumber
        };
      }

      const response = await axios.post(endpoint, payload);

      setMessage(
        response.data.message || "Registration successful!"
      );

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center" }}>📝 Register</h2>

      <label>Select Role</label>

      <select
        value={role}
        onChange={(e) => {
          setRole(e.target.value);
          setMessage("");
          setError("");
        }}
        style={styles.input}
      >
        <option value="admin">Admin</option>
        <option value="student">Student</option>
        <option value="parent">Parent</option>
        <option value="driver">Bus Driver</option>
      </select>

      <form onSubmit={handleSubmit}>
        <label>
          {role === "student"
            ? "Student Name"
            : role === "parent"
            ? "Parent Name"
            : role === "driver"
            ? "Driver Name"
            : "Admin Name"}
        </label>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter full name"
          required
          style={styles.input}
        />

        <label>Email</label>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter email address"
          required
          style={styles.input}
        />

        <label>Password</label>

        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          placeholder="At least 8 characters"
          required
          style={styles.input}
        />

        {role === "admin" && (
          <>
            <label>Admin Setup Key</label>
            <input
              type="password"
              name="setupKey"
              value={form.setupKey}
              onChange={handleChange}
              placeholder="Enter private setup key"
              required
              style={styles.input}
            />
            <p style={styles.note}>
              Only the first Admin can register. Keep the
              setup key private.
            </p>
          </>
        )}

        {role === "student" && (
          <>
            <label>Parent Name</label>
            <input
              name="parentName"
              value={form.parentName}
              onChange={handleChange}
              placeholder="Enter parent name"
              required
              style={styles.input}
            />

            <label>Parent Email</label>
            <input
              type="email"
              name="parentEmail"
              value={form.parentEmail}
              onChange={handleChange}
              placeholder="Enter parent email"
              required
              style={styles.input}
            />

            <label>Select Bus</label>
            <select
              name="busNumber"
              value={form.busNumber}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="BUS001">BUS001</option>
              <option value="BUS003">BUS003</option>
            </select>
          </>
        )}

        {role === "driver" && (
          <>
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
              style={styles.input}
            />

            <label>Driving License Number</label>
            <input
              name="licenseNumber"
              value={form.licenseNumber}
              onChange={handleChange}
              placeholder="Enter license number"
              required
              style={styles.input}
            />

            <p style={styles.note}>
              Register with the exact name and email assigned
              by your Admin. Your bus is assigned by the Admin.
            </p>
          </>
        )}

        {message && (
          <p style={{ color: "green" }}>{message}</p>
        )}

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 20 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 650,
    margin: "35px auto",
    padding: 35,
    borderRadius: 16,
    boxShadow: "0 0 20px #ddd",
    background: "white",
    fontFamily: "Arial, sans-serif"
  },
  input: {
    display: "block",
    width: "100%",
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
    boxSizing: "border-box",
    border: "1px solid #ccc",
    borderRadius: 7,
    fontSize: 16
  },
  button: {
    width: "100%",
    padding: 14,
    background: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: 7,
    fontSize: 17,
    cursor: "pointer"
  },
  note: {
    background: "#f2f6fc",
    padding: 12,
    borderRadius: 7,
    lineHeight: 1.5
  }
};

export default Register;