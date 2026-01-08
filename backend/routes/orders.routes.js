import { Router } from 'express';
import Joi from 'joi';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import adminAuth from '../middleware/adminJWT.js';
import { sendOrderMail } from '../utils/mailer.js';
import mongoose from 'mongoose';

const router = Router();

const orderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            productId: Joi.string().required(),
            qty: Joi.number().integer().min(1).required()
        })
    ).min(1).required(),
    customerName: Joi.string().required(),
    phone: Joi.string().required(),
    paymentMethod: Joi.string().valid('MPESA', 'ECOCASH').required()  // New: require method upfront
});

router.post('/', async (req, res, next) => {
    const { error } = orderSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { items, customerName, phone, paymentMethod } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let total = 0;
        const orderItems = [];
        const itemDetails = [];

        for (const i of items) {
            const product = await Product.findById(i.productId).session(session);
            if (!product) throw new Error('Product not found');
            if (product.stock < i.qty) throw new Error(`Insufficient stock for ${product.name}`);

            product.stock -= i.qty;
            await product.save({ session });

            total += product.price * i.qty;
            orderItems.push({
                product: product._id,
                qty: i.qty,
                price: product.price
            });

            itemDetails.push({
                name: product.name,
                quantity: i.qty,
                price: product.price,
                total: product.price * i.qty
            });
        }

        let orderNumber;
        while (true) {
            const num = Math.floor(1000 + Math.random() * 9000);
            orderNumber = num.toString();
            const existing = await Order.findOne({ orderNumber }).session(session);
            if (!existing) break;
        }

        const order = new Order({
            orderNumber,
            customerName,
            phone,
            items: orderItems,
            total,
            payment: { 
                method: paymentMethod,
                status: 'Pending',
                depositAmount: total * 0.25, // Store deposit amount
                balanceDue: total * 0.75
            },
            tracking: [
                { status: 'Order Placed', description: 'We received your order' },
                { status: 'Processing', description: 'Preparing your flowers' }
            ]
        });

        await order.save({ session });
        await session.commitTransaction();

        try {
            await sendOrderMail(order, itemDetails);  // Admin receives notification
            console.log('Admin notification email sent successfully');
        } catch (emailErr) {
            console.error('Failed to send admin notification email:', emailErr);
        }

        res.status(201).json({
            orderId: order.orderNumber,
            total: order.total,
            deposit: total * 0.25,
            payment: {
                method: paymentMethod,
                instructions: `Please send the 25% deposit of M${(total * 0.25).toFixed(2)} to our ${paymentMethod} number.`
            }
        });
    } catch (err) {
        await session.abortTransaction();
        next(err);
    } finally {
        session.endSession();
    }
});

router.get('/track', async (req, res) => {
    const { orderNumber, phone } = req.query;
    const order = await Order.findOne({ orderNumber, phone }).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found or invalid phone' });
    res.json(order);
});

router.get('/:id', async (req, res) => {
    const order = await Order
        .findById(req.params.id)
        .populate('items.product');

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
});

router.patch('/:id/status', adminAuth, async (req, res, next) => {
    try {
        let { status } = req.body;
        status = status.trim();  // Trim any whitespace

        const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        order.tracking.push({
            status,
            description: `Order marked as ${status}`
        });

        await order.save();
        res.json(order);
    } catch (err) {
        console.error('Error updating order status:', err);  // Log full error for debugging
        next(err);  // Pass to global error handler
    }
});

router.patch('/:id/payment-status', adminAuth, async (req, res, next) => {
    try {
        let { paymentStatus } = req.body;
        paymentStatus = paymentStatus.trim();

        const allowed = ['Pending', 'Paid', 'Failed'];
        if (!allowed.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const order = await Order.findById(req.params.id).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.payment.status = paymentStatus;
        order.tracking.push({
            status: `Payment ${paymentStatus}`,
            description: `Payment status updated to ${paymentStatus}`
        });

        await order.save();
        res.json(order);
    } catch (err) {
        console.error('Error updating payment status:', err);
        next(err);
    }
});

router.get('/', adminAuth, async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('items.product');
    res.json(orders);
});

export default router;