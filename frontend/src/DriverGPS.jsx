import { useEffect, useRef, useState } from "react";
import axios from "axios";
import socket from "./socket";

function DriverGPS() {
    const [driver, setDriver] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const watchId = useRef(null);
    const simulationId = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!token || user?.role !== "driver") {
            setError("Please login with a driver account.");
            return;
        }

        axios.get("http://localhost:5000/api/drivers/me", {
            headers: { Authorization: `Bearer ${token}` }
        }).then((response) => {
            setDriver(response.data);
            if (!response.data.bus) setError("No bus is assigned to this driver.");
        }).catch((err) => {
            setError(err.response?.data?.message || "Unable to load driver profile.");
        });

        return () => {
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
            if (simulationId.current !== null) clearInterval(simulationId.current);
        };
    }, []);

    const sendLocation = (position) => {
        if (!driver?.bus?.busNumber) return;
        const coords = position.coords;
        socket.emit("driverLocation", {
            busId: driver.bus.busNumber,
            latitude: coords.latitude,
            longitude: coords.longitude,
            speed: typeof coords.speed === "number" && coords.speed >= 0 ? coords.speed : null
        });
        setMessage(`Live location sent for ${driver.bus.busNumber}`);
        setError("");
    };

    const startGPS = () => {
        if (!navigator.geolocation) {
            setError("GPS is not supported by this browser.");
            return;
        }
        if (!driver?.bus) {
            setError("No bus is assigned to this driver.");
            return;
        }
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = navigator.geolocation.watchPosition(
            sendLocation,
            (err) => setError(`GPS Error: ${err.message}`),
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );
        setMessage("GPS tracking started.");
    };

    const stopGPS = () => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        setMessage("GPS tracking stopped.");
    };

    const startTestSimulation = () => {
        if (!driver?.bus) {
            setError("No bus is assigned to this driver.");
            return;
        }
        if (simulationId.current !== null) clearInterval(simulationId.current);
        let latitude = 17.6868;
        let longitude = 83.2185;
        simulationId.current = setInterval(() => {
            latitude += 0.00015;
            longitude += 0.00010;
            socket.emit("driverLocation", {
                busId: driver.bus.busNumber,
                latitude,
                longitude,
                speed: 30 / 3.6
            });
            setMessage(`Test location sent for ${driver.bus.busNumber}`);
        }, 3000);
        setMessage("Test GPS simulation started.");
    };

    const stopSimulation = () => {
        if (simulationId.current !== null) {
            clearInterval(simulationId.current);
            simulationId.current = null;
        }
        setMessage("Test simulation stopped.");
    };

    return (
        <div style={{ maxWidth: "650px", margin: "40px auto", padding: "25px", textAlign: "center" }}>
            <h1>🚌 Driver GPS Tracking</h1>
            {driver && (
                <>
                    <h2>{driver.user?.name}</h2>
                    <p>Assigned Bus: <b>{driver.bus?.busNumber}</b></p>
                    <p>Bus: {driver.bus?.busName}</p>
                    <button onClick={startGPS} style={{ margin: 5, padding: "10px 18px" }}>📍 Start Real GPS</button>
                    <button onClick={stopGPS} style={{ margin: 5, padding: "10px 18px" }}>⏹ Stop GPS</button>
                    <br />
                    <button onClick={startTestSimulation} style={{ margin: 5, padding: "10px 18px" }}>🧪 Start Test GPS</button>
                    <button onClick={stopSimulation} style={{ margin: 5, padding: "10px 18px" }}>⏹ Stop Test</button>
                </>
            )}
            {message && <p style={{ color: "green" }}>{message}</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            <p>Real GPS is for the driver's phone. Test GPS is for desktop development.</p>
        </div>
    );
}

export default DriverGPS;
