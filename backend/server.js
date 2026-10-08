const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/buses", require("./routes/busRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/routes", require("./routes/routeRoutes"));
app.use("/api/bus-stops", require("./routes/busStopRoutes"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

app.get("/", (req, res) => {
    res.send("College Bus Tracking Backend is Running!");
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("driverLocation", (data) => {
        if (!data?.busId || typeof data.latitude !== "number" || typeof data.longitude !== "number") return;
        const location = {
            busId: data.busId,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: typeof data.speed === "number" ? data.speed : null,
            timestamp: Date.now()
        };
        console.log("Driver location:", location);
        io.emit("busLocation", location);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");
        server.listen(process.env.PORT, () => {
            console.log(`Server running on http://localhost:${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Failed:", error.message);
    });
