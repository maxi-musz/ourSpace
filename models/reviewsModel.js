import mongoose from "mongoose";

// Schema to store stay period
const stayPeriodSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true }
});

// Review schema
const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    starValue: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    stayPeriod: stayPeriodSchema,
    cleanliness: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    accuracy: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    value: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    service: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    facilities: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    location: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    images: {
        type: [String],
    },
    reviewCertification: {
        type: Boolean,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
