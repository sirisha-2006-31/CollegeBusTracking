const express = require("express");

const Route = require("../models/Route");

const protect = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ===============================
// ADD ROUTE
// ===============================
router.post(
    "/",
    protect,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const {
                routeName,
                startPoint,
                endPoint,
                stops
            } = req.body;

            if (
                !routeName ||
                !startPoint ||
                !endPoint
            ) {
                return res.status(400).json({
                    message:
                        "Please provide route name, start point and end point"
                });
            }

            const route = new Route({
                routeName,
                startPoint,
                endPoint,
                stops: stops || []
            });

            await route.save();

            res.status(201).json({
                message:
                    "Route added successfully",
                route
            });
        }
        catch (error) {
            console.error(
                "Add route error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error"
            });
        }
    }
);


// Public reads: students need route information for tracking.
router.get("/", async (req, res) => {
    try {
        const routes = await Route.find().sort({ createdAt: -1 });
        res.json(routes);
    } catch (error) {
        console.error("Get public routes error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: "Route not found" });
        res.json(route);
    } catch (error) {
        console.error("Get public route error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ===============================
// UPDATE ROUTE
// ===============================
router.put(
    "/:id",
    protect,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const {
                routeName,
                startPoint,
                endPoint,
                stops
            } = req.body;

            const route =
                await Route.findByIdAndUpdate(
                    req.params.id,
                    {
                        routeName,
                        startPoint,
                        endPoint,
                        stops: stops || []
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!route) {
                return res.status(404).json({
                    message:
                        "Route not found"
                });
            }

            res.json({
                message:
                    "Route updated successfully",
                route
            });
        }
        catch (error) {
            console.error(
                "Update route error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error"
            });
        }
    }
);


// ===============================
// DELETE ROUTE
// ===============================
router.delete(
    "/:id",
    protect,
    allowRoles("admin"),
    async (req, res) => {
        try {
            const route =
                await Route.findByIdAndDelete(
                    req.params.id
                );

            if (!route) {
                return res.status(404).json({
                    message:
                        "Route not found"
                });
            }

            res.json({
                message:
                    "Route deleted successfully"
            });
        }
        catch (error) {
            console.error(
                "Delete route error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error"
            });
        }
    }
);


module.exports = router;
