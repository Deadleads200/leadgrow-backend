const mongoose = require('mongoose');

const HerosectionSchema = new mongoose.Schema({
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
    backgroundImg: {
        type: String,
        required: true,
        trim: true
    },
    mainImg: {
        type: String,
        required: true,
        trim: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Herosection', HerosectionSchema);
