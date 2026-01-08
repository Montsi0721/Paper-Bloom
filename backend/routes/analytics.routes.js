import { Router } from 'express';
import Analytics from '../models/Analytics.js';
import adminAuth from '../middleware/adminJWT.js';

const router = Router();

// Track analytics event (public endpoint)
router.post('/track', async (req, res) => {
    try {
        const { type, path, productId, orderId } = req.body;
        
        const analyticsData = {
            type,
            path,
            productId,
            orderId,
            metadata: {
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection.remoteAddress,
                referrer: req.headers.referer || req.headers.referrer
            }
        };

        await Analytics.create(analyticsData);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        res.status(500).json({ success: false });
    }
});

// Get analytics data (admin only)
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        // Get daily page views
        const dailyViews = await Analytics.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get event counts by type
        const eventCounts = await Analytics.aggregate([
            {
                $match: { createdAt: { $gte: daysAgo } }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get top products viewed
        const topProducts = await Analytics.aggregate([
            {
                $match: {
                    type: 'product_view',
                    createdAt: { $gte: daysAgo },
                    productId: { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$productId',
                    views: { $sum: 1 }
                }
            },
            { $sort: { views: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ]);

        // Get traffic by hour (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const hourlyTraffic = await Analytics.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: oneDayAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            dailyViews,
            eventCounts,
            topProducts,
            hourlyTraffic,
            totalViews: dailyViews.reduce((sum, day) => sum + day.count, 0)
        });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

export default router;