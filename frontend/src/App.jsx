import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import StudentTracking from "./StudentTracking";
import DriverGPS from "./DriverGPS";
import Register from "./Register";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";

function App() {
    return (
        <BrowserRouter>
            <nav style={{ padding: "15px", textAlign: "center", background: "#1e3a8a" }}>
                <Link to="/" style={{ color: "white", margin: "10px", textDecoration: "none" }}>🗺️ Tracking</Link>
                <Link to="/driver" style={{ color: "white", margin: "10px", textDecoration: "none" }}>📍 Driver GPS</Link>
                <Link to="/register" style={{ color: "white", margin: "10px", textDecoration: "none" }}>📝 Register</Link>
                <Link to="/login" style={{ color: "white", margin: "10px", textDecoration: "none" }}>🔐 Login</Link>
                <Link to="/admin" style={{ color: "white", margin: "10px", textDecoration: "none" }}>🛠️ Admin</Link>
            </nav>
            <Routes>
                <Route path="/student" element={<StudentTracking />} />
                <Route path="/" element={<StudentTracking />} />
                <Route path="/driver" element={<DriverGPS />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App;
