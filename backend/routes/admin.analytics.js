import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import adminJWT from '../middleware/adminJWT.js';

const router = Router();

router.get('/dashboard', adminJWT, async (req, res) => {
    const totalSales = await Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, sum: { $sum: '$total' } } }
    ]);

    const orderCount = await Order.countDocuments();
    const lowStock = await Product.find({ stock: { $lt: 5 } });

    res.json({
        totalRevenue: totalSales[0]?.sum || 0,
        orderCount,
        lowStock
    });
});

export default router;