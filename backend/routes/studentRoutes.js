
const express = require("express");
const Student = require("../models/Student");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Return the logged-in student's or parent's assigned bus.
router.get(
    "/my-bus",
    protect,
    allowRoles("student", "parent"),
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    message: "User account not found"
                });
            }

            let student;

            if (user.role === "student") {
                student = await Student.findOne({
                    user: user._id
                })
                    .populate("user", "name email")
                    .populate({
                        path: "bus",
                        populate: {
                            path: "route",
                            select: "routeName startPoint endPoint stops"
                        }
                    });
            } else {
                student = await Student.findOne({
                    parentEmail: user.email
                })
                    .populate("user", "name email")
                    .populate({
                        path: "bus",
                        populate: {
                            path: "route",
                            select: "routeName startPoint endPoint stops"
                        }
                    });
            }

            if (!student) {
                return res.status(404).json({
                    message: "No student is linked to this account"
                });
            }

            if (!student.bus) {
                return res.status(404).json({
                    message: "No bus is assigned to this student"
                });
            }

            if (student.bus.status !== "active") {
                return res.status(403).json({
                    message: "The assigned bus is currently inactive"
                });
            }

            return res.json({
                studentName: student.user?.name || user.name,
                bus: student.bus
            });
        } catch (error) {
            console.error("Get assigned bus error:", error);

            return res.status(500).json({
                message: "Unable to get assigned bus"
            });
        }
    }
);

module.exports = router;
