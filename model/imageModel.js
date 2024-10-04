const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },  // Store the path to the image
    timestamp: { type: Date, default: Date.now }
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
