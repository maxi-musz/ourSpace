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
    status: {
        type: String,
        enum: ['pending', 'success'],
        default: 'pending',
        required: true
    },
    paystackRef: {
        type: String,
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
