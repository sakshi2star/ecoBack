const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    cartData: { // Add cartData to schema
        type: Map,
        of: Number, // Assuming each cart item is represented by a number (like quantity)
        default: {} // Default empty cart
    }
}, {
    timestamps: true // This option adds createdAt and updatedAt fields
});

const User = mongoose.model('User', userSchema);
module.exports = User;
