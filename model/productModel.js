const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true // Ensure IDs are unique
},
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  reviews: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  thumbnails: {
    type: [String],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  sizes: {
    type: [String],
    required: true
  },
  colors: {
    type: [String],
    required: true
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
