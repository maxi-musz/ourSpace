import mongoose from "mongoose";

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
        required: [true, "Only values between 1 - 5 is allowed"]
    },
    title: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    stayPeriod: {
        type: String,  // YYYY-MM-DD format
        required: [true, "only dates in this format YYYY-MM-DD is allowed"],
        validate: {
          validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),  // Validate the date format
          message: props => `${props.value} is not a valid date!`
        }
      },
    cleanliness: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, "Only numbers between 1 - 10 is allowed"]
    },
    accuracy: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, "Only numbers between 1 - 10 is allowed"]
    },
    value: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, "Only numbers between 1 - 10 is allowed"]
    },
    service: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, "Only numbers between 1 - 10 is allowed"]
    },
    facilities: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, "Only numbers between 1 - 10 is allowed"]
    },
    location: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, "Only numbers between 1 - 10 is allowed"]
    },
    reviewImages: {
        type: [String],
    },
    reviewCertification: {
        type: Boolean,
        default: true,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
