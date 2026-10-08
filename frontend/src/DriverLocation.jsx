import { useEffect, useState } from "react";
import axios from "axios";
import socket from "./socket";

function DriverLocation() {
    const [buses, setBuses] = useState([]);

    useEffect(() => {

        const loadBuses = async () => {
            try {
                const token =
                    localStorage.getItem("token");

                const response = await axios.get(
                    "http://localhost:5000/api/buses",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                console.log(
                    "Buses loaded from MongoDB:",
                    response.data
                );

                setBuses(response.data);

            } catch (error) {
                console.error(
                    "Unable to load buses:",
                    error
                );
            }
        };

        loadBuses();

    }, []);


    useEffect(() => {

        if (buses.length === 0) {
            return;
        }

        console.log(
            "Starting GPS simulation for:",
            buses
        );


        const sendLocations = () => {

            buses.forEach((bus, index) => {

                // Different starting positions
                const startingLocations = [
                    {
                        latitude: 17.6868,
                        longitude: 83.2185
                    },
                    {
                        latitude: 17.7380,
                        longitude: 83.3240
                    }
                ];

                const location =
                    startingLocations[index] ||
                    startingLocations[0];


                const data = {

                    busId:
                        bus.busNumber,

                    latitude:
                        location.latitude +
                        Math.random() * 0.001,

                    longitude:
                        location.longitude +
                        Math.random() * 0.001
                };


                console.log(
                    `Sending ${data.busId} location:`,
                    data
                );


                socket.emit(
                    "driverLocation",
                    data
                );

            });

        };


        // Send immediately
        sendLocations();


        // Send every 3 seconds
        const interval =
            setInterval(
                sendLocations,
                3000
            );


        return () => {
            clearInterval(interval);
        };

    }, [buses]);


    return null;
}

export default DriverLocation;