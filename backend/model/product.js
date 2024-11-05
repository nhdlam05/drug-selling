const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String },
    price: { type: Number, required: true },
    discount: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
    stock: { type: Number, default: 0 },
    ingredients: { type: String },
    usage: { type: String },
    origin: { type: String },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
    images: { type: String },
    rating: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    totalSold: { type: Number, default: 0 }  // Tổng số lượng đã bán
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
