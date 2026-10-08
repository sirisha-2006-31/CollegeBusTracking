const express = require("express");
const Bus = require("../models/Bus");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const router = express.Router();

// Public read: students need buses and their assigned route.
router.get("/", async (req, res) => {
    try {
        const buses = await Bus.find().populate("route", "routeName startPoint endPoint stops").sort({ createdAt: -1 });
        res.json(buses);
    } catch (error) {
        console.error("Get buses error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id).populate("route", "routeName startPoint endPoint stops");
        if (!bus) return res.status(404).json({ message: "Bus not found" });
        res.json(bus);
    } catch (error) {
        console.error("Get bus error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/", protect, allowRoles("admin"), async (req, res) => {
    try {
        const { busNumber, busName, capacity, status, route } = req.body;
        if (!busNumber || !busName || capacity === undefined) return res.status(400).json({ message: "Please provide bus number, bus name and capacity" });
        if (await Bus.findOne({ busNumber })) return res.status(400).json({ message: "Bus number already exists" });
        const bus = await Bus.create({ busNumber, busName, capacity, status: status || "active", route: route || null });
        res.status(201).json({ message: "Bus added successfully", bus });
    } catch (error) {
        console.error("Add bus error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/:id", protect, allowRoles("admin"), async (req, res) => {
    try {
        const { busNumber, busName, capacity, status, route } = req.body;
        const bus = await Bus.findByIdAndUpdate(req.params.id, { busNumber, busName, capacity, status, route: route || null }, { new: true, runValidators: true }).populate("route", "routeName startPoint endPoint stops");
        if (!bus) return res.status(404).json({ message: "Bus not found" });
        res.json({ message: "Bus updated successfully", bus });
    } catch (error) {
        console.error("Update bus error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/:id", protect, allowRoles("admin"), async (req, res) => {
    try {
        const bus = await Bus.findByIdAndDelete(req.params.id);
        if (!bus) return res.status(404).json({ message: "Bus not found" });
        res.json({ message: "Bus deleted successfully" });
    } catch (error) {
        console.error("Delete bus error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
module.exports = router;
