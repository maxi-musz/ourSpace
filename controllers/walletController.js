import axios from "axios";
import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Wallet from "../models/walletModel.js";
import { formatAmount, formatDate, generateBookingInvoicePDF } from "../utils/helperFunction.js";

const getWallet = asyncHandler(async (req, res) => {
    console.log("Getting wallet dashboard...".blue);

    let walletMetrics = await Wallet.findOne({user: req.user._id})

    if (!walletMetrics) {
        console.log("Wallet not found, using default values".yellow);
        walletMetrics = {
            currentBalance: 0,
            totalWithdrawn: 0,
            totalEarned: 0,
        };
    }   

    try {
        // Fetch bookings and populate related models (listing and user)
        const bookings = await Booking.find({ 
            spaceOwnerId: req.user._id,
            paystackPaymentStatus: "success"
         })
            .populate('listing')
            .populate('user');

        console.log(`Total of ${bookings.length} bookings found`.green);

        const formattedBookings = bookings.map(booking => ({
            id: booking._id,
            invoiceId: booking.invoiceId,  
            date: formatDate(booking.createdAt),
            description: `${booking.listing.propertyId} - ${booking.listing.propertyName} (Room ${booking.listing.propertyLocation.apartmentNumber})`,
            spaceUserName: booking.user.firstName,
            totalNights: booking.totalNight,
            amount: `#${formatAmount(booking.totalIncuredChargeAfterDiscount)}`  
        }));

        return res.status(200).json({
            success: true,
            message: `Total of ${bookings.length} bookings found`,
            data: {
                wallet: {
                    currentBalance: `#${formatAmount(walletMetrics.currentBalance)}`,
                    witdrawn: `#${formatAmount(walletMetrics.totalWithdrawn)}`,
                    allTimeEarned: `#${formatAmount(walletMetrics.totalEarned)}`
                },
                bookings: formattedBookings
            }
        });
    } catch (error) {
        console.log("Error getting wallet", error);
        return res.status(500).json({
            success: false,
            message: "Error getting wallet"
        });
    }
});

const getSingleBookingFromWalletDashboard = asyncHandler(async (req, res) => {
    console.log("Getting single booking from wallet dashboard".cyan);

    const { walletBookingId } = req.body;  // If this is from a POST request
    console.log(walletBookingId);

    try {
        // Fetch the booking and populate the listing
        const bookingPayment = await Booking.findById(walletBookingId).populate('listing');
        
        if (!bookingPayment) {
            console.log("Booking payment not found".red);
            return res.status(404).json({
                success: false,
                message: "Booking payment history not found",
            });
        }

        const formattedData = {
            invoiceId: bookingPayment.invoiceId,  
            date: formatDate(bookingPayment.createdAt),
            description: `${bookingPayment.listing.propertyId} - ${bookingPayment.listing.propertyName} (Room ${bookingPayment.listing.propertyLocation.apartmentNumber})`,
            amount: `#${formatAmount(bookingPayment.totalIncuredChargeAfterDiscount)}`
        };

        console.log("Booking payment history found".green);
        return res.status(200).json({
            success: true,
            message: "Booking successfully retrieved",
            data: formattedData
        });

    } catch (error) {
        console.error("Error retrieving booking payment history".red, error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the booking",
        });
    }
});

const getBookingPDF = asyncHandler(async (req, res) => {
    console.log("Generating invoice pdf".blue)
    const { walletBookingId } = req.body;

    try {
        const bookingPayment = await Booking.findById(walletBookingId).populate('listing');

        if (!bookingPayment) {
            return res.status(404).json({
                success: false,
                message: "Booking payment history not found",
            });
        }

        // Prepare the data for the PDF
        const bookingData = {
            invoiceId: bookingPayment.invoiceId,
            date: formatDate(bookingPayment.createdAt),
            description: `${bookingPayment.listing.propertyId} - ${bookingPayment.listing.propertyName} (Room ${bookingPayment.listing.propertyLocation.apartmentNumber})`,
            amount: `#${formatAmount(bookingPayment.totalIncuredChargeAfterDiscount)}`
        };

        // Call the PDF generation function
        generateBookingInvoicePDF(bookingData, res);

    } catch (error) {
        console.error("Error generating booking PDF:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while generating the PDF.",
        });
    }
});

export const spaceOwnerGetBanks = async (req, res) => {
    console.log("Getting all banks".yellow)
    try {
        const response = await axios.get('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const { status, data } = response.data;

        const formattedBanks = data.map(bank => ({
            name: bank.name,
            code: bank.code
        }));

        if (status) {
            console.log("Bank list retrieved successfully".blue)
            return res.status(200).json({
                success: true,
                message: "Bank list retrieved successfully",
                banks: formattedBanks
            });
        } else {
            console.log("Failed to retrieve bank list".red)
            return res.status(400).json({
                success: false,
                message: "Failed to retrieve bank list"
            });
        }

    } catch (error) {
        console.error("Error fetching bank list", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the bank list"
        });
    }
};

export const spaceOwnerVerifyBankDetails = async (req, res) => {
    const { account_number, bank_code } = req.body; // bank_code represents the bank name in paystack
    
    try {
        const response = await axios.get(`https://api.paystack.co/bank/resolve`, {
            params: {
                account_number,
                bank_code
            },
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const { status, data } = response.data;

        if (status) {
            return res.status(200).json({
                success: true,
                message: "Bank details verified successfully",
                account_name: data.account_name // Return account name to the frontend
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to verify bank details"
            });
        }

    } catch (error) {
        console.error("Error verifying bank details", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while verifying bank details"
        });
    }
};

export const createOrFindTransferRecipient = async (req, res) => {
    const { account_number, bank_code, bank_name, account_name } = req.body;

    const userId = req.user._id

    try {
        // Find the user's bank details in the database
        let userBankDetails = await BankDetails.findOne({ user: userId });

        if (userBankDetails) {
            // Check if the bank account already exists
            const existingBank = userBankDetails.banks.find(bank => 
                bank.account_number === account_number && 
                bank.bank_code === bank_code
            );

            if (existingBank) {
                // Bank already exists, return the recipient_code
                return res.status(200).json({
                    success: true,
                    message: "Transfer recipient already exists",
                    recipient_code: existingBank.recipient_code,
                });
            }
        } else {
            // If no BankDetails entry exists for the user, create one
            userBankDetails = new BankDetails({ user: userId, banks: [] });
        }

        // If no existing bank found, create a new transfer recipient via Paystack
        const response = await axios.post(
            `https://api.paystack.co/transferrecipient`, 
            {
                type: "nuban",
                name: account_name,
                account_number: account_number,
                bank_code: bank_code,
                currency: "NGN",
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                }
            }
        );

        const { status, data } = response.data;

        if (status) {
            // Add the new bank and recipient_code to the user's bank array
            const newBank = {
                bank_name: bank_name,
                bank_code: bank_code,
                account_number: account_number,
                account_name: account_name,
                recipient_code: data.recipient_code,
            };

            userBankDetails.banks.push(newBank);
            await userBankDetails.save();  // Save the new bank details

            return res.status(200).json({
                success: true,
                message: "Transfer recipient created successfully",
                recipient_code: data.recipient_code,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to create transfer recipient",
            });
        }

    } catch (error) {
        console.error("Error creating transfer recipient", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while creating transfer recipient",
        });
    }
};

export const initiateTransfer = async (req, res) => {
    const { amount, recipient_code, reason } = req.body;

    try {
        const response = await axios.post(
            `https://api.paystack.co/transfer`, 
            {
                source: "balance",  // Paystack balance
                amount: amount * 100,  // Amount in kobo (multiply NGN by 100)
                recipient: recipient_code,  // Transfer recipient's code
                reason: reason || "Withdrawal from wallet",  // Optional transfer reason
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                },
            }
        );

        const { status, data } = response.data;

        if (status) {
            return res.status(200).json({
                success: true,
                message: "Transfer initiated successfully",
                transfer_details: data  // Return transfer details
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to initiate transfer",
            });
        }

    } catch (error) {
        console.error("Error initiating transfer", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while initiating the transfer"
        });
    }
};

export const fundWallet = async (req, res) => {
    const { email, amount } = req.body; // Email of the user funding wallet, and the amount they want to fund
    
    // Paystack requires the amount in kobo (multiply by 100)
    const amountInKobo = amount * 100;

    try {
        const response = await axios.post(`https://api.paystack.co/transaction/initialize`, {
            email,
            amount: amountInKobo,
            callback_url: "https://yourdomain.com/api/paystack/verify"  // Callback for verifying the payment
        }, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const { status, data } = response.data;

        if (status) {
            return res.status(200).json({
                success: true,
                message: "Payment initialized",
                payment_url: data.authorization_url // URL to redirect the user to for completing payment
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to initialize payment"
            });
        }

    } catch (error) {
        console.error("Error initializing payment", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while initializing payment"
        });
    }
};

export const verifyTransaction = async (req, res) => {
    const { reference } = req.query;  // Paystack provides a reference for the transaction

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const { status, data } = response.data;

        if (status && data.status === 'success') {
            // Payment was successful, update the user's wallet balance
            const user = await User.findOne({ email: data.customer.email });
            user.walletBalance += data.amount / 100;  // Add the funded amount to wallet (in Naira)
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Payment verified and wallet funded successfully",
                walletBalance: user.walletBalance
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

    } catch (error) {
        console.error("Error verifying payment", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while verifying payment"
        });
    }
};


export {
    getWallet,
    getSingleBookingFromWalletDashboard,
    getBookingPDF
}