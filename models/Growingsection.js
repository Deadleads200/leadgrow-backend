const mongoose = require('mongoose');

const GrowingSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    count: {
        type: Number,
        default: 0,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Growing', GrowingSchema);
