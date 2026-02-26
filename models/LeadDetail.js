const mongoose = require('mongoose');

const LeadDetailSchema = new mongoose.Schema({
    CategoryId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    type: {
    type: String,
    enum: ["manual", "api"],
    default: "manual"
  }, 
    name: { type: String },      
    email: { type: [String] },      
    shop: { type: String },
    phone: { type: [String] },       
    website: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postcode: { type: String },
    street: { type: String },
    lon: { type: Number },
    lat: { type: Number },
    openinghours: { type: String },
    geoJsonData: {
        type: Object,               
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LeadDetail', LeadDetailSchema);
