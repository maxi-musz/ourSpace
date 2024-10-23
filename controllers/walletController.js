import axios from "axios";
import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Wallet from "../models/walletModel.js";
import { formatAmount, formatDate, generateBookingInvoicePDF } from "../utils/helperFunction.js";
import BankDetails from "../models/bankModel.js";
import User from "../models/userModel.js";

export const spaceOwnerGetWallet = asyncHandler(async (req, res) => {
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

export const soGetSingleBookingFromWalletDashboard = asyncHandler(async (req, res) => {
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

export const getBookingPDF = asyncHandler(async (req, res) => {
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

export const spaceOwnerGetBanksAndSavedAccount = asyncHandler(async (req, res) => {
    console.log("Getting all banks".yellow)
    try {
        const response = await axios.get('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const userSavedBankDetails = await BankDetails.find({user: req.user._id})

        const formattedUserSavedBankAccounts = userSavedBankDetails.map(bank => ({
            bankName: bank.bank_name,
            accountNumber: bank.account_number,
            accountName: bank.account_name,
            bankCode: bank.bank_code
        }))

        const { status, data } = response.data;

        const formattedPaystackBanks = data.map(bank => ({
            name: bank.name,
            code: bank.code
        }));

        if (status) {
            console.log("Bank list retrieved successfully".blue)
            return res.status(200).json({
                success: true,
                message: "Bank list retrieved successfully",
                data: {
                    userSavedBankAccounts: formattedUserSavedBankAccounts,
                    allBanks: formattedPaystackBanks
                }
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
});

export const spaceOwnerVerifyAccountNumber = asyncHandler(async (req, res) => {
    const { account_number, bank_code } = req.body;

    try {
        // Verify bank details with Paystack
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

            console.log("Account name successfully retrieved: ", data.account_name)
            return res.status(200).json({
                success: true,
                message: "Bank details verified successfully",
                account_name: data.account_name
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
});

export const spaceOwnerSaveNewAccountDetails = asyncHandler(async (req, res) => {
    console.log("User adding new account details for withdrawal".blue);

    const userId = req.user._id;

    const existingUser = await User.findById(userId);

    if (!existingUser) {
        console.log("User not found".red);
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const { account_number, bank_code } = req.body;

    if (!bank_code || !account_number) {
        console.log("Bank code and account number are required before saving new bank details");
        return res.status(500).json({
            success: false,
            message: "Bank code and account number are required before saving new bank details"
        });
    }

    // Check if the entered accountexists in the list of accounts fr that user first
    let bankDetails = await BankDetails.findOne({ user: userId });
    if(bankDetails) {
        const existingAccount = bankDetails.banks.some(bank => bank.account_number === account_number);
    
        if (existingAccount) {
            console.log("Bank account already exists in the list of saved banks".red);
            return res.status(400).json({ success: false, message: 'Bank account already exists in the list of saved banks' });
        }
    }

    // call paystack resolve to get account name
    try {
        const response = await axios.get(`https://api.paystack.co/bank/resolve`, {
            params: {
                account_number: account_number,
                bank_code: bank_code
            },
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const { status: resolve_status, data: resolve_data } = response.data;

        // Ensure that Paystack returns valid data
        if (resolve_status && resolve_data) {

            console.log("Creating new transfer recipient".green) //Create new transfer recipient for the user
            const transfer_recipient_response = await axios.post(
                `https://api.paystack.co/transferrecipient`, 
                {
                    type: "nuban",
                    name: resolve_data.account_name,
                    account_number: resolve_data.account_number,
                    bank_code: bank_code,
                    currency: "NGN",
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                    }
                }
            );
    
            const { status: recipient_status, data:recipient_data } = transfer_recipient_response.data;
            
            if(recipient_status && recipient_data){
                console.log("New transfer recipient successfully created", recipient_data.recipient_code)
    
                    // Push new bank details into the array
                    if(bankDetails) {
                        bankDetails.banks.push({
                            bank_name: recipient_data.details.bank_name,
                            account_number: recipient_data.details.account_number,
                            account_name: recipient_data.details.account_name,
                            bank_code: recipient_data.details.bank_code,
                            transfer_recipient: recipient_data.recipient_code
                        });

                        await bankDetails.save()

                        console.log("Successfully added a new bank details to the list of banks".rainbow)
                        return res.status(200).json({
                            success: true,
                            message: "Successfully added a new bank details to the list of banks"
                        })
                    } else {
                        bankDetails = new BankDetails ({
                            user: userId,
                            banks: {
                                bank_name: recipient_data.details.bank_name,
                                account_number: recipient_data.details.account_number,
                                account_name: recipient_data.details.account_name,
                                bank_code: recipient_data.details.bank_code,
                                recipient_code: recipient_data.recipient_code
                            }
                        })
                        await bankDetails.save()

                        console.log("New bank account successfully saved".rainbow)

                        return res.status(200).json({
                            success: true,
                            message: "New bank account successfully saved",
                            data: bankDetails
                        })
                    }
                    
                } else {
                    console.log("Error generating reciepint code".red)
                    return res.status(400).json({
                        success: false,
                        message: "Error generating reciepint code"
                    });
                
            }
        } else {
            console.log("Error verifying account number".red)
            return res.status(400).json({
                success: false,
                message: "Error verifying account number"
            });
        }
    } catch (error) {
        console.error("Error verifying bank details", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while verifying bank details"
        });
    }
});

export const initiateTransfer = async (req, res) => {
    const { amount, recipient_code } = req.body;

    const reason = "Withdrawal from wallet"

    try {
        const response = await axios.post(
            `https://api.paystack.co/transfer`, 
            {
                source: "balance",  // Paystack balance
                amount: amount * 100,  // Amount in kobo (multiply NGN by 100)
                recipient: recipient_code,  
                reason: reason  
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                },
            }
        );

        const { status, data } = response.data;

        console.log("data from withdrawal request: ", data)

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