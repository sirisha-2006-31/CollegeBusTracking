const mongoose = require("mongoose");

const busStopSchema = new mongoose.Schema(
    {
        stopName: {
            type: String,
            required: true
        },

        latitude: {
            type: Number,
            required: true
        },

        longitude: {
            type: Number,
            required: true
        },

        route: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Route",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "BusStop",
    busStopSchema
);