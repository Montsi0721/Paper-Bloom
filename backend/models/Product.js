import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
        type: String,
        enum: ['Bouquet', 'Single Flower', 'Arrangements', 'Set'],
        required: true
    },
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

ProductSchema.index({ name: 'text' });  // For better search

const Product = mongoose.model('Product', ProductSchema);
export default Product;