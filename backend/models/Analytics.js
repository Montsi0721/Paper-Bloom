import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['page_view', 'product_view', 'add_to_cart', 'order_placed'],
        required: true
    },
    path: String,  // e.g., "/", "/products", etc.
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    metadata: {
        userAgent: String,
        ip: String,
        referrer: String
    }
}, { timestamps: true });

// Index for faster queries
AnalyticsSchema.index({ type: 1, createdAt: -1 });
AnalyticsSchema.index({ createdAt: -1 });

const Analytics = mongoose.model('Analytics', AnalyticsSchema);
export default Analytics;