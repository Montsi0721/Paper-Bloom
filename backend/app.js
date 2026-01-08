import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import productRoutes from './routes/products.routes.js';
import orderRoutes from './routes/orders.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminAnalytics from './routes/admin.analytics.js';
import analyticsRoutes from './routes/analytics.routes.js';
import paymentRoutes from './routes/payments.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // Limit each IP to 100 requests per window
    message: 'Too many requests, please try again later.'
});

app.use(limiter);
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https: http: blob:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' http://localhost:5000;"
    );
    next();
});
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
            connectSrc: ["'self'", "http://localhost:5000"],
            frameSrc: ["'self'"]
        }
    }
}));
app.use(morgan('dev'));
app.use(cors({ origin: 'http://localhost:3000' }));  // Restrict origins in prod
app.use(express.json());
app.use(express.static('frontend'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);  // Optional now
app.use('/api/admin/analytics', adminAnalytics);
app.use('/api/analytics', analyticsRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

export default app;