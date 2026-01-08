import { Router } from 'express';
import Review from '../models/Review.js';

const router = Router();

router.get('/', async (_, res) => {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
});

router.post('/', async (req, res) => {
    const { name, email, message } = req.body;
    const review = await Review.create({ name, email, message });
    res.status(201).json(review);
});

export default router;