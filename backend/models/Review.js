import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    stars: { type: Number, default: 5 }
}, { timestamps: true });

const Review = mongoose.model('Review', ReviewSchema);
export default Review;