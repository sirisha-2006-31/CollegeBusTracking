const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            role
        } = req.body;


        if (!name || !email || !password) {

            return res.status(400).json({
                message: "Please fill all required fields"
            });

        }


        const existingUser =
            await User.findOne({ email });


        if (existingUser) {

            return res.status(400).json({
                message: "User already exists"
            });

        }


        const hashedPassword =
            await bcrypt.hash(password, 10);


        const user = new User({

            name,

            email,

            password: hashedPassword,

            role: role || "student"

        });


        await user.save();


        res.status(201).json({

            message: "Registration successful",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }

        });

    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });

    }

});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                message: "Email and password are required"
            });

        }


        // Find user
        const user =
            await User.findOne({ email });


        if (!user) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        // Compare password
        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isPasswordCorrect) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        // Create JWT
        const token =
            jwt.sign(

                {
                    id: user._id,
                    role: user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "1d"
                }

            );


        res.json({

            message: "Login successful",

            token: token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });

    }

});


module.exports = router;