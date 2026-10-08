import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import socket from "./socket";

import "leaflet/dist/leaflet.css";

const busIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

function LiveMap() {

    const [location, setLocation] = useState({
        latitude: 17.6868,
        longitude: 83.2185
    });

    useEffect(() => {

        socket.on("busLocation", (data) => {

            console.log("Bus location received:", data);

            setLocation({
                latitude: data.latitude,
                longitude: data.longitude
            });

        });

        return () => {
            socket.off("busLocation");
        };

    }, []);

    return (
        <div>

            <h2>🚌 Live Bus Tracking</h2>

            <MapContainer
                center={[
                    location.latitude,
                    location.longitude
                ]}
                zoom={15}
                style={{
                    height: "500px",
                    width: "100%"
                }}
            >

                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                    position={[
                        location.latitude,
                        location.longitude
                    ]}
                    icon={busIcon}
                >

                    <Popup>
                        🚌 College Bus
                        <br />
                        Latitude: {location.latitude}
                        <br />
                        Longitude: {location.longitude}
                    </Popup>

                </Marker>

            </MapContainer>

        </div>
    );
}

export default LiveMap;