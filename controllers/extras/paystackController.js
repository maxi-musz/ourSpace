import axios from 'axios';
import Transaction from '../../models/transactionsModel.js';
import sendEmail from '../../utils/sendMail.js';
import Booking from '../../models/bookingsModel.js';
import Listing from '../../models/listingModel.js';
import asyncHandler from '../../middleware/asyncHandler.js';

export const initializeTransaction = asyncHandler(async (req, res) => {
    console.log("Initializing Paystack payment...".green);

    const userId = req.user._id
    console.log("userId", userId)

    const {
        email, amountInNaira, callBackUrl,listingId, newBookedDays,
        firstName, lastName, phoneNumber
    } = req.body;

    // Input validation
    if (!email || !amountInNaira || !callBackUrl || !userId || !listingId) {
        return res.status(400).json({
            success: false,
            message: 'All fields (email, amountInNaira, callBackUrl, userId, listingId and newBookedDays) are required.',
        });
    }

    const amountInKobo = amountInNaira * 100;

    // Retrieve listing from database
    const listing = await Listing.findById(listingId);

    if (!listing) {
        console.log("Listing not found".red)
        return res.status(404).json({
            success: false,
            message: 'Listing not found.',
        });
    }

    const conflictingDates = listing.bookedDays.filter(date => newBookedDays.includes(date));

    if (conflictingDates.length > 0) {
        console.log("Some of the selected dates are already booked".red)
        return res.status(400).json({
            success: false,
            message: 'Some of the selected dates are already booked.',
            data: { conflictingDates }
        });
    }

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amountInKobo,
                first_name: firstName,
                last_name: lastName,
                phone: phoneNumber,
                callback_url: callBackUrl,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.TEST_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { authorization_url, access_code, reference } = response.data.data;

        const callBackWithReference = `${callBackUrl}?reference=${reference}`;

        await Transaction.create({
            user: userId,
            listing: listingId,
            email,
            amount: amountInKobo / 100,
            access_code,
            reference,
            status: 'initialized'
        });

        console.log(`Transaction initialized for amount: ₦${amountInNaira}`.cyan);

        res.status(200).json({
            success: true,
            message: `Transaction initialized successfully.`,
            data: {
                authorization_url,
                access_code,
                reference,
                callBackWithReference,  
            },
        });
    } catch (error) {
        console.error("Error initializing transaction:", error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize transaction. Please try again later.',
        });
    }
});


export const handleWebhook = async (req, res) => {
    const event = req.body;

    // I try to verify if the webhook is valid
    if (event.event === 'charge.success') {
        const { reference } = event.data;
        const { amount, status, email } = event.data.customer;

        // I first find the transaction
        const transaction = await Transaction.findOne({ reference });

        if (transaction && transaction.amount === amount) {
            await Transaction.findOneAndUpdate(
                { reference },
                { status: 'successful' }
            );

            // Deliver the value to the customer (e.g., activate booking, provide access, etc.)
            // deliverValueToCustomer(transaction);

            const ourspaceEmail = process.env.OUR_SPACE_EMAIL
            const maximusEmail = process.env.MAXIMUS_EMAIL
            const waitlistRegisterNotificationEmail = `${ourspaceEmail}, ${maximusEmail}`;
            await sendEmail(
                waitlistRegisterNotificationEmail,
                "Ourspace bookings payment",
                `A new payment of ${amount / 100} Naira was made by ${email}.`
            )
            console.log("payment confirmed and email sent")

            res.status(200).send('Webhook received and processed');
        } else {
            res.status(400).send('Transaction verification failed');
        }
    } else {
        res.status(400).send('Invalid event type');
    }
};

export const verifyTransaction = asyncHandler(async (req, res) => {
    console.log("Verifying transaction...".green);

    const {
        reference,
        userId,
        listingId,
        firstName,
        lastName,
        email,
        phoneNumber,
        bookingForSomeone,
        newBookedDays,
        totalGuest,
        discount
    } = req.body;

    // Input validation
    if (
        !reference ||
        !userId ||
        !listingId ||
        !firstName ||
        !lastName ||
        !email ||
        !phoneNumber ||
        !newBookedDays ||
        !totalGuest
    ) {
        console.log("reference, userId, listingId, firstName, lastName,email,phoneNumber, newBookedDays,totalGuests fields must be provided")
        return res.status(400).json({
            success: false,
            message: 'reference, userId, listingId, firstName, lastName,email,phoneNumber, newBookedDays,totalGuests fields must be provided'
        });
    }

    try {
        // Verify transaction with Paystack
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.TEST_SECRET_KEY}`,
                },
            }
        );

        const { status: paystackStatus, amount: paystackKoboAmount, customer } = response.data.data;

        if (paystackStatus !== 'success') {
            console.log("Payment failed".red)
            return res.status(400).json({
                success: false,
                message: 'Payment was not successful.',
            });
        }

        // Retrieve transaction from database
        const transaction = await Transaction.findOne({ reference });

        if (!transaction) {
            console.log("Payment was successful but transaction wasn notfound in database".red)
            return res.status(404).json({
                success: false,
                message: 'Payment was successful but transaction wasn notfound in database.',
            });
        }

        if (transaction.status === 'success') {
            console.log("Transaction has already been verified".bgRed)
            return res.status(400).json({
                success: false,
                message: 'Transaction has already been verified.',
            });
        }

        const normalAmount = paystackKoboAmount / 100

        if (transaction.amount !== normalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Paid amount does not match expected amount.',
            });
        }

        const listing = await Listing.findById(listingId);

        transaction.status = 'success';
        await transaction.save();

        // Create booking
        const newBooking = await Booking.create({
            user: userId,
            listing: listingId,
            firstName,
            lastName,
            email,
            phoneNumber,
            bookingForSomeone,
            bookedDays: newBookedDays,
            totalGuest,
            amount: normalAmount, // Convert back to Naira
            discount: discount || 0
        });

        listing.bookedDays = [...listing.bookedDays, ...newBookedDays];
        await listing.save();

        console.log("Transaction verified and booking created successfully.".cyan);

        res.status(200).json({
            success: true,
            message: 'Transaction verified and booking created successfully.',
            data: {
                booking: newBooking,
                transaction
            },
        });
    } catch (error) {
        console.error("Error verifying transaction:", error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while verifying the transaction.',
        });
    }
});

export const handleCallback = async (req, res) => {
    const { reference } = req.query;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                },
            }
        );

        const { status, amount } = response.data.data;

        // Find the transaction by reference and verify the amount
        const transaction = await Transaction.findOne({ reference });

        if (transaction && transaction.amount === amount) {
            // Update transaction status and deliver value to customer
            await Transaction.findOneAndUpdate(
                { reference },
                { status }
            );

            // Deliver the value to the customer (e.g., activate booking, provide access, etc.)
            // deliverValueToCustomer(transaction);

            res.status(200).json({
                status: 'success',
                message: 'Transaction verified',
                data: response.data.data,
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: 'Transaction verification failed',
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.response ? error.response.data.message : error.message,
        });
    }
};

