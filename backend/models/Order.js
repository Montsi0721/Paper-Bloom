import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    orderNumber: { 
        type: String, 
        unique: true,
        required: true
     },
    customerName: String,
    phone: String,
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        qty: Number,
        price: Number
    }],
    payment: {
        method: {
            type: String,
            enum: ['MPESA', 'ECOCASH'],
            required: true
        },
        status: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed'],
            default: 'Pending'
        },
        transactionRef: String,
        depositAmount: Number,
        balanceDue: Number
    },
    total: Number,
    status: {
        type: String,
        default: 'Processing',
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled']
    },
    tracking: [{
        status: String,
        description: String,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// OrderSchema.index({ orderNumber: 1 }, { unique: true });

const Order = mongoose.model('Order', OrderSchema);
export default Order;