const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Student = require("../models/Student");
const Bus = require("../models/Bus");
const Driver = require("../models/Driver");
const DriverAssignment = require("../models/DriverAssignment");

const router = express.Router();

// =====================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =====================================
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in as Admin"
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required"
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login session"
    });
  }
};

// =====================================
// FIRST ADMIN REGISTRATION
// =====================================
router.post("/admin-register", async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body;

    if (!name || !email || !password || !setupKey) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    if (
      !process.env.ADMIN_SETUP_KEY ||
      setupKey !== process.env.ADMIN_SETUP_KEY
    ) {
      return res.status(403).json({
        message: "Invalid Admin setup key"
      });
    }

    // Do not allow registration if an Admin already exists
    const existingAdmin = await User.findOne({
      role: "admin"
    });

    if (existingAdmin) {
      return res.status(403).json({
        message: "An Admin account already exists"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    return res.status(201).json({
      message: "Admin registered successfully. Please log in."
    });
  } catch (error) {
    console.error("Admin registration error:", error);

    return res.status(500).json({
      message: "Server error during Admin registration"
    });
  }
});

// =====================================
// ADMIN ASSIGNS BUS TO DRIVER
// =====================================
router.post(
  "/admin/assign-driver",
  requireAdmin,
  async (req, res) => {
    try {
      const { name, email, busNumber } = req.body;

      if (!name || !email || !busNumber) {
        return res.status(400).json({
          message: "Driver name, email and bus are required"
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail
      });

      if (existingUser) {
        return res.status(400).json({
          message: "This email already belongs to a registered account"
        });
      }

      const bus = await Bus.findOne({
        busNumber: busNumber.trim(),
        status: "active"
      });

      if (!bus) {
        return res.status(400).json({
          message: "Selected bus was not found or is inactive"
        });
      }

      const existingAssignment = await DriverAssignment.findOne({
        email: normalizedEmail
      });

      if (existingAssignment) {
        if (existingAssignment.status === "registered") {
          return res.status(400).json({
            message: "This driver is already registered"
          });
        }

        existingAssignment.name = name.trim();
        existingAssignment.bus = bus._id;
        existingAssignment.assignedBy = req.user.id;

        await existingAssignment.save();

        return res.json({
          message: "Driver assignment updated successfully"
        });
      }

      await DriverAssignment.create({
        name: name.trim(),
        email: normalizedEmail,
        bus: bus._id,
        assignedBy: req.user.id,
        status: "pending"
      });

      return res.status(201).json({
        message: "Bus assigned to driver successfully"
      });
    } catch (error) {
      console.error("Driver assignment error:", error);

      return res.status(500).json({
        message: "Server error while assigning bus"
      });
    }
  }
);

// =====================================
// STUDENT REGISTRATION
// =====================================
router.post("/register", async (req, res) => {
  let user;

  try {
    const {
      name,
      email,
      password,
      parentName,
      parentEmail,
      busNumber
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !parentName ||
      !parentEmail ||
      !busNumber
    ) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const studentEmail = email.trim().toLowerCase();
    const normalizedParentEmail =
      parentEmail.trim().toLowerCase();

    if (studentEmail === normalizedParentEmail) {
      return res.status(400).json({
        message: "Student and parent emails must be different"
      });
    }

    const existingUser = await User.findOne({
      email: studentEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const bus = await Bus.findOne({
      busNumber: busNumber,
      status: "active"
    });

    if (!bus) {
      return res.status(400).json({
        message: "Selected bus was not found or is inactive"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name: name.trim(),
      email: studentEmail,
      password: hashedPassword,
      role: "student"
    });

    await user.save();

    const student = new Student({
      user: user._id,
      parentName: parentName.trim(),
      parentEmail: normalizedParentEmail,
      bus: bus._id
    });

    await student.save();

    return res.status(201).json({
      message: "Student registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Student registration error:", error);

    if (user && user._id) {
      await User.findByIdAndDelete(user._id).catch(() => {});
    }

    return res.status(500).json({
      message: "Server error during registration"
    });
  }
});

// =====================================
// PARENT REGISTRATION
// =====================================
router.post("/parent-register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const student = await Student.findOne({
      parentEmail: normalizedEmail
    });

    if (!student) {
      return res.status(400).json({
        message:
          "This email is not registered as a student's parent email"
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const parent = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "parent"
    });

    await parent.save();

    return res.status(201).json({
      message: "Parent registration successful",
      user: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        role: parent.role
      }
    });
  } catch (error) {
    console.error("Parent registration error:", error);

    return res.status(500).json({
      message: "Server error during parent registration"
    });
  }
});

// =====================================
// DRIVER REGISTRATION
// ADMIN ASSIGNMENT REQUIRED
// =====================================
router.post("/driver-register", async (req, res) => {
  let user;

  try {
    const {
      name,
      email,
      password,
      phone,
      licenseNumber
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !licenseNumber
    ) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const assignment = await DriverAssignment.findOne({
      email: normalizedEmail,
      status: "pending"
    });

    if (!assignment) {
      return res.status(403).json({
        message:
          "No pending bus assignment found for this email. Contact Admin."
      });
    }

    if (
      assignment.name.trim().toLowerCase() !==
      name.trim().toLowerCase()
    ) {
      return res.status(400).json({
        message: "Name does not match the Admin's assignment"
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This email already has an account"
      });
    }

    const existingDriver = await Driver.findOne({
      licenseNumber: licenseNumber.trim()
    });

    if (existingDriver) {
      return res.status(400).json({
        message: "This license number is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name: assignment.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "driver"
    });

    await Driver.create({
      name: assignment.name,
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim(),
      user: user._id,
      bus: assignment.bus
    });

    assignment.status = "registered";
    await assignment.save();

    return res.status(201).json({
      message: "Driver registered successfully. You can now log in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Driver registration error:", error);

    if (user) {
      await Driver.deleteOne({ user: user._id }).catch(() => {});
      await User.findByIdAndDelete(user._id).catch(() => {});
    }

    return res.status(500).json({
      message: "Server error during Driver registration"
    });
  }
});

// =====================================
// LOGIN FOR ALL ROLES
// =====================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Server authentication is not configured"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
