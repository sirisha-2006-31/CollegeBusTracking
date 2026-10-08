const mongoose = require("mongoose");
const busSchema = new mongoose.Schema({
    busNumber: { type: String, required: true, unique: true, trim: true },
    busName: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null }
}, { timestamps: true });
module.exports = mongoose.model("Bus", busSchema);
