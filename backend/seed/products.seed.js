import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

await mongoose.connect(process.env.MONGO_URI);

const products = [
    {
        name: 'Paper Rose Bouquet',
        description: 'Handcrafted red paper roses wrapped in premium paper.',
        price: 250,
        stock: 20,
        category: 'Bouquet',
        image: 'http://localhost:5000/images/red_rose_bouquet.jpeg'
    },
    {
        name: 'Paper Sunflower',
        description: 'Bright handmade sunflower made from recycled paper.',
        price: 120,
        stock: 30,
        category: 'Single Flower',
        image: 'http://localhost:5000/images/single_sunflower.jpeg'
    },
    {
        name: 'Paper Lily Arrangement',
        description: 'Elegant white paper lilies for special occasions.',
        price: 300,
        stock: 15,
        category: 'Arrangements',
        image: 'http://localhost:5000/images/pink_rose_bouquet.jpeg'
    },
    {
        name: 'Custom Name Flower Box',
        description: 'Personalized flower box with custom name.',
        price: 450,
        stock: 10,
        category: 'Set',
        image: 'http://localhost:5000/images/flower_box2.jpeg'
    }
];

try {
    await Product.deleteMany();
    const result = await Product.insertMany(products);
    
    console.log('Products seeded successfully!');
    console.log(`Seeded ${result.length} products:`);
    
    result.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - M${product.price} (${product.category})`);
        console.log(`   Image: ${product.image}`);
    });
    
    process.exit(0);
} catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
}