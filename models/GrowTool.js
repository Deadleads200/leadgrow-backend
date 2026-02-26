const mongoose = require('mongoose');

const GrowToolSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String, 
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('GrowTool', GrowToolSchema);