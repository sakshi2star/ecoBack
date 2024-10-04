const mongoose = require('mongoose');

// Create a counter schema
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

// Create the Counter model
const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;
