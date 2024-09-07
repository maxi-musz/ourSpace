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
    paystackAccessCode: { type: String, required: true },
    paystackReference: { type: String, required: true },
    paystackPaymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
        required: true
    },
    bookingStatus: {
        type: String,
        enum: ['pending','upcoming', 'in-progress','completed', "cancelled"],
        default: 'pending',
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    bookingForSomeone: {
        fullName: String,
        phoneNumber: String
    },
    bookedDays: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v.every(date => !isNaN(Date.parse(date)));
            },
            message: props => `${props.value} contains invalid date format.`
        }
    },
    totalGuest: {
        type: Number,
        required: true,
        min: [1, 'At least one guest is required.']
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative.']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative.']
    },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
