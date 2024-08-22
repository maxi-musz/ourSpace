import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    nightsSpent: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
