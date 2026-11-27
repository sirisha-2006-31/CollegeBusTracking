
const express = require("express");
const jwt = require("jsonwebtoken");
const Feedback = require("../models/Feedback");

const router = express.Router();

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please log in first",
    });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login session",
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

// Get the logged-in user's feedback
router.get("/mine", authenticate, async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      user: req.user.id,
    });

    res.json(feedback);
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({ message: "Unable to load feedback" });
  }
});

// Create or update feedback
router.put("/", authenticate, async (req, res) => {
  try {
    if (!["student", "parent"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only students and parents can submit feedback",
      });
    }

    const rating = Number(req.body.rating);
    const comments =
      typeof req.body.comments === "string"
        ? req.body.comments.trim()
        : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Please select a rating from 1 to 5 stars",
      });
    }

    if (comments.length > 1000) {
      return res.status(400).json({
        message: "Comments cannot exceed 1000 characters",
      });
    }

    const feedback = await Feedback.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          role: req.user.role,
          rating,
          comments,
        },
        $setOnInsert: {
          user: req.user.id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      message: "Feedback saved successfully",
      feedback,
    });
  } catch (error) {
    console.error("Save feedback error:", error);
    res.status(500).json({
      message: "Unable to save feedback",
    });
  }
});

// Admin: view all feedback and average rating
router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email role")
      .sort({ updatedAt: -1 });

    const totalFeedback = feedback.length;

    const averageRating =
      totalFeedback > 0
        ? feedback.reduce((sum, item) => sum + item.rating, 0) /
          totalFeedback
        : 0;

    res.json({
      totalFeedback,
      averageRating: Number(averageRating.toFixed(2)),
      feedback,
    });
  } catch (error) {
    console.error("Admin feedback error:", error);
    res.status(500).json({
      message: "Unable to load feedback",
    });
  }
});

module.exports = router;
