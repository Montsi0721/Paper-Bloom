import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = Router();

router.post('/initiate', async (req, res) => {
    const { items, customerName, phone, method } = req.body;

    if (!['MPESA', 'ECOCASH'].includes(method)) {
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    let total = 0;
    const orderItems = [];

    for (const i of items) {
        const product = await Product.findById(i.productId);
        if (!product || product.stock < i.qty) {
            return res.status(400).json({ message: 'Invalid product or stock' });
        }

        product.stock -= i.qty;
        await product.save();

        total += product.price * i.qty;
        orderItems.push({
            product: product._id,
            qty: i.qty,
            price: product.price
        });
    }

    const order = await Order.create({
        customerName,
        phone,
        items: orderItems,
        total,
        payment: {
            method,
            status: 'Pending'
        },
        tracking: [
            { status: 'Awaiting Payment', description: 'Waiting for payment confirmation' }
        ]
    });

    res.json({
        orderId: order._id,
        amount: total,
        paymentInstructions: `Dial *123# to approve ${method} payment`
    });
});

router.post('/confirm', async (req, res) => {
    const { orderId, success, transactionRef } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!success) {
        order.payment.status = 'Failed';
        order.status = 'Cancelled';
        await order.save();
        return res.json({ message: 'Payment failed' });
    }

    order.payment.status = 'Paid';
    order.payment.transactionRef = transactionRef;
    order.status = 'Processing';
    order.tracking.push({
        status: 'Payment Confirmed',
        description: 'Payment received successfully'
    });

    await order.save();
    res.json({ message: 'Payment confirmed' });
});

export default router;