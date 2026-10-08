const express = require("express");

const Driver = require("../models/Driver");

const protect = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// ADD NEW DRIVER
// ==========================================

router.post(
    "/",
    protect,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const {
                name,
                phone,
                licenseNumber,
                user,
                bus
            } = req.body;

            if (
                !name ||
                !phone ||
                !licenseNumber ||
                !user
            ) {

                return res.status(400).json({
                    message:
                        "Please provide name, phone, license number and user"
                });

            }

            const existingDriver =
                await Driver.findOne({
                    licenseNumber
                });

            if (existingDriver) {

                return res.status(400).json({
                    message:
                        "License number already exists"
                });

            }

            const driver = new Driver({
                name,
                phone,
                licenseNumber,
                user,
                bus: bus || null
            });

            await driver.save();

            res.status(201).json({

                message:
                    "Driver added successfully",

                driver

            });

        }

        catch (error) {

            console.error(
                "Add driver error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error"
            });

        }

    }
);


// Logged-in driver: return the driver record and assigned bus.
router.get("/me", protect, allowRoles("driver"), async (req, res) => {
    try {
        const driver = await Driver.findOne({ user: req.user.id })
            .populate("user", "name email role")
            .populate("bus", "busNumber busName capacity status route");
        if (!driver) return res.status(404).json({ message: "Driver profile not found" });
        res.json(driver);
    } catch (error) {
        console.error("Get my driver profile error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ==========================================
// GET ALL DRIVERS
// ==========================================

router.get(
    "/",
    protect,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const drivers =
                await Driver.find()
                    .populate("user", "name email role")
                    .populate(
                        "bus",
                        "busNumber busName"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.json(drivers);

        }

        catch (error) {

            console.error(
                "Get drivers error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error"
            });

        }

    }
);


// ==========================================
// GET ONE DRIVER
// ==========================================

router.get(
    "/:id",
    protect,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const driver =
                await Driver.findById(
                    req.params.id
                )
                .populate(
                    "user",
                    "name email role"
                )
                .populate(
                    "bus",
                    "busNumber busName"
                );

            if (!driver) {

                return res.status(404).json({
                    message:
                        "Driver not found"
                });

            }

            res.json(driver);

        }

        catch (error) {

            console.error(
                "Get driver error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error"
            });

        }

    }
);


// ==========================================
// UPDATE DRIVER
// ==========================================

router.put(
    "/:id",
    protect,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const {
                name,
                phone,
                licenseNumber,
                user,
                bus
            } = req.body;

            const driver =
                await Driver.findByIdAndUpdate(

                    req.params.id,

                    {
                        name,
                        phone,
                        licenseNumber,
                        user,
                        bus: bus || null
                    },

                    {
                        new: true,
                        runValidators: true
                    }

                );

            if (!driver) {

                return res.status(404).json({
                    message:
                        "Driver not found"
                });

            }

            res.json({

                message:
                    "Driver updated successfully",

                driver

            });

        }

        catch (error) {

            console.error(
                "Update driver error:",
                error
            );

            res.status(500).json({
                message:
                    "Server error"
            });

        }

    }
);


// ==========================================
// DELETE DRIVER
// ==========================================

router.delete(
    "/:id",
    protect,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const driver =
                await Driver.findByIdAndDelete(
                    req.params.id
                );

            if (!driver) {

                return res.status(404).json({
                    message:
                        "Driver not found"
                });

            }

            res.json({
                message:
                    "Driver deleted successfully"
            });

        }

        catch (error) {

            console.error(
                "Delete driver error:",
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
