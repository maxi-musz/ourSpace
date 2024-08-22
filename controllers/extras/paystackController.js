import axios from 'axios';
import Transaction from '../../models/transactionsModel.js';

export const initializeTransaction = async (req, res) => {
    console.log("Paystack payment initialised".bgGreen);

    const { email, amountInNaira, callBackUrl } = req.body;
    const amountInKobo = amountInNaira * 100; // Convert to kobo

    const { userId, listingId } = req.query;

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amountInKobo, // Use amountInKobo
                callback_url: callBackUrl // Ensure this is set correctly
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.TEST_SECRET_KEY}`, // Ensure this is set correctly
                    'Content-Type': 'application/json',
                },
            }
        );

        // Extract necessary details from Paystack response
        const { authorization_url, access_code, reference } = response.data.data;

        // Saving the Paystack response to the database
        await Transaction.create({
            user: userId,
            listing: listingId,
            email,
            amount: amountInKobo, // Store amount in kobo
            access_code,
            reference
        });

        console.log(`Transaction amount of: ${amountInKobo} initialised`.america);

        res.status(200).json({
            success: true,
            message: `Transaction amount of: ${amountInKobo} initialised`,
            data: {
                authorization_url,
                access_code,
                reference,
            },
        });
    } catch (error) {
        console.log("Error:", error.response ? error.response.data.message : error.message);
        res.status(500).json({
            status: 'error',
            message: error.response ? error.response.data.message : error.message,
        });
    }
};

export const handleWebhook = async (req, res) => {
    const event = req.body;

    // I try to verify if the webhook is valid
    if (event.event === 'charge.success') {
        const { reference } = event.data;
        const { amount, status } = event.data;

        // I first find the transaction
        const transaction = await Transaction.findOne({ reference });

        if (transaction && transaction.amount === amount) {
            await Transaction.findOneAndUpdate(
                { reference },
                { status: 'successful' }
            );

            // Deliver the value to the customer (e.g., activate booking, provide access, etc.)
            // deliverValueToCustomer(transaction);

            res.status(200).send('Webhook received and processed');
        } else {
            res.status(400).send('Transaction verification failed');
        }
    } else {
        res.status(400).send('Invalid event type');
    }
};

export const verifyTransaction = async (req, res) => {
    console.log("Verifying transaction")
    const { reference } = req.query;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.TEST_SECRET_KEY}`,
                },
            }
        );

        const { status, amount } = response.data.data;
        
        // Find the transaction by reference and verify the amount
        const transaction = await Transaction.findOne({ reference });
        console.log(`Amount to be paid: ${transaction.amount}\nAmount paid: ${amount}`.blue)

        if (transaction && transaction.amount === amount) {
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

