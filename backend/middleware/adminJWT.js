import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';  // Add this import

const adminAuth = async (req, res, next) => {  // Make it async
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Authorization header missing' 
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Token missing from authorization header' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add await here and fix the import
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: 'Admin not found' });
        }
        
        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(500).json({ message: 'Authentication error' });
    }
};

export default adminAuth;