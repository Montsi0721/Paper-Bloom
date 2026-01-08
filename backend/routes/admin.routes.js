import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = Router();

router.post('/login', async (req, res) => {
    console.log('Login attempt:', req.body.username);
    const { username, password } = req.body;
    console.log('Received credentials:', { username, password });
    
    const admin = await Admin.findOne({ username });
    if (!admin) {
        console.log('Admin not found for username:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
    } 
    
    const isPasswordValid = await admin.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
        console.log('Invalid password for admin:', username);
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: admin._id },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    console.log('Login successful, token generated for admin:', username);
    res.json({ token });
});

export default router;