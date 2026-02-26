const mongoose = require('mongoose');

const GrowworkingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    shortDescription: {
        type: String,
        required: true,
        trim: true
    },
}, { timestamps: true });

module.exports = mongoose.model('GrowWorking', GrowworkingSchema);