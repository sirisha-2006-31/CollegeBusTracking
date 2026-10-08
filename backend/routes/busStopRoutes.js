const express = require("express");

const BusStop = require("../models/BusStop");

const protect = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ===============================
// ADD BUS STOP
// ===============================
router.post(
    "/",
    protect,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const {
                stopName,
                latitude,
                longitude,
                route
            } = req.body;

            if (
                !stopName ||
                latitude === undefined ||
                longitude === undefined ||
                !route
            ) {
                return res.status(400).json({
                    message:
                        "Please provide stop name, latitude, longitude and route"
                });
            }

            const busStop = new BusStop({
                stopName,
                latitude,
                longitude,
                route
            });

            await busStop.save();

            res.status(201).json({
                message:
                    "Bus stop added successfully",
                busStop
            });
        }
        catch (error) {
            console.error(
                "Add bus stop error:",
                error
            );

            res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }
);


// Public reads: students need stop coordinates for ETA.
router.get("/", async (req, res) => {
    try {
        const busStops = await BusStop.find().populate("route", "routeName startPoint endPoint stops").sort({ createdAt: -1 });
        res.json(busStops);
    } catch (error) {
        console.error("Get public bus stops error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const busStop = await BusStop.findById(req.params.id).populate("route", "routeName startPoint endPoint stops");
        if (!busStop) return res.status(404).json({ message: "Bus stop not found" });
        res.json(busStop);
    } catch (error) {
        console.error("Get public bus stop error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ===============================
// UPDATE BUS STOP
// ===============================
router.put(
    "/:id",
    protect,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const {
                stopName,
                latitude,
                longitude,
                route
            } = req.body;

            const busStop =
                await BusStop.findByIdAndUpdate(
                    req.params.id,
                    {
                        stopName,
                        latitude,
                        longitude,
                        route
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!busStop) {
                return res.status(404).json({
                    message:
                        "Bus stop not found"
                });
            }

            res.json({
                message:
                    "Bus stop updated successfully",
                busStop
            });
        }
        catch (error) {
            console.error(
                "Update bus stop error:",
                error
            );

            res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }
);


// ===============================
// DELETE BUS STOP
// ===============================
router.delete(
    "/:id",
    protect,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const busStop =
                await BusStop.findByIdAndDelete(
                    req.params.id
                );

            if (!busStop) {
                return res.status(404).json({
                    message:
                        "Bus stop not found"
                });
            }

            res.json({
                message:
                    "Bus stop deleted successfully"
            });
        }
        catch (error) {
            console.error(
                "Delete bus stop error:",
                error
            );

            res.status(500).json({
                message: "Server error",
                error: error.message
            });
        }
    }
);


module.exports = router;
