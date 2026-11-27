const mongoose = require("mongoose");

const driverAssignmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "registered"],
      default: "pending"
    }
  },
  { timestamps: true }
);

driverAssignmentSchema.index(
  { email: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "DriverAssignment",
  driverAssignmentSchema
);