import { Router } from 'express';
import Product from '../models/Product.js';

const router = Router();

router.get('/', async (req, res) => {
    const products = await Product.find({ isActive: true });
    res.json(products);
});

export default router;