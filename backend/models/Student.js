
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        parentName: {
            type: String,
            required: true,
            trim: true
        },

        parentEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        bus: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bus",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Student", studentSchema);
