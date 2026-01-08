import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paperbloom');
        console.log('Connected to MongoDB');

        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;

        await Admin.deleteOne({ username });

        const existing = await Admin.findOne({ username });
        if (existing) {
            console.log(`Admin user "${username}" already exists.`);
            process.exit(0);
        }

        const admin = new Admin({ username, password });
        await admin.save();
        console.log(`Admin user created successfully. \nUsername: ${username}\nPassword: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();