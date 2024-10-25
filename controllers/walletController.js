import axios from "axios";
import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Wallet from "../models/walletModel.js";
import { formatAmount, formatDate, formatDateWithoutTime, generateBookingInvoicePDF } from "../utils/helperFunction.js";
import BankDetails from "../models/bankModel.js";
import User from "../models/userModel.js";
import Withdrawal from "../models/withdrawalRequestModel.js";
import FundingHistory from "../models/fundingModel.js";

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
            amount: booking.totalIncuredChargeAfterDiscount 
        }));

        const withdrawals = await Withdrawal.find({
            user: req.user._id,
        }).populate("user").sort({createdAt: -1})

        const formattedWithdrawals = withdrawals.map((withdrawal) => ({
            id: withdrawal._id,
            invoiceId: withdrawal.paystack_id,
            date: formatDate(withdrawal.createdAt),
            description: withdrawal.reason,
            status: withdrawal.status,
            amount: withdrawal.amount,
            accountName: withdrawal.user.firstName + " " + withdrawal.user.lastName
        }))

        return res.status(200).json({
            success: true,
            message: "User dashboard successfully retrieved",
            data: {
                wallet: {
                    currentBalance: walletMetrics.currentBalance,
                    witdrawn: walletMetrics.totalWithdrawn,
                    allTimeEarned: walletMetrics.totalEarned
                },
                withdrawals: formattedWithdrawals,
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

    const { walletBookingId } = req.body;
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

export const downloadBookingPDF = asyncHandler(async (req, res) => {
    console.log("Generating invoice pdf".blue);
    const { walletBookingId } = req.query;

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

        // Set headers to indicate a PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');

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
    console.log("User", req.user._id)
    try {
        const response = await axios.get('https://api.paystack.co/bank', {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const userSavedBankDetails = await BankDetails.find({ user: req.user._id });

        const formattedUserSavedBankAccounts = userSavedBankDetails.flatMap(bankDetail => 
            bankDetail.banks.map(bank => ({
                id: bank.id,
                bankName: bank.bankName,
                accountNumber: bank.accountNumber,
                accountName: bank.accountName,
                recipientCode: bank.recipientCode
            }))
        );

        // console.log("Banks", formattedUserSavedBankAccounts);

        const { status, data } = response.data;

        const formattedPaystackBanks = data.map(bank => ({
            id: bank.id,
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
    console.log("User verifying account number".blue)

    const { account_number, bank_code } = req.body;

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
            console.log("Account name successfully retrieved: ", data.account_name);
            return res.status(200).json({
                success: true,
                message: "Bank details verified successfully",
                account_name: data.account_name
            });
        } else {
            console.log(`Failed to verify bank details: ${data.message}`);
            return res.status(400).json({
                success: false,
                message: `Failed to verify bank details: ${data.message}`
            });
        }
    } catch (error) {
        // Handle the error message and extract the response message
        if (error.response && error.response.data && error.response.data.message) {
            console.error(error.response.data.message);
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data.message  // Extract the specific error message from Paystack
            });
        } else {
            // For unexpected errors
            console.error("Unexpected error verifying bank details", error);
            return res.status(500).json({
                success: false,
                message: "An unexpected error occurred while verifying bank details"
            });
        }
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
        const existingAccount = bankDetails.banks.some(bank => bank.accountNumber === account_number);
    
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
                            bankName: recipient_data.details.bank_name,
                            accountNumber: recipient_data.details.account_number,
                            accountName: recipient_data.details.account_name,
                            bankCode: recipient_data.details.bank_code,
                            recipientCode: recipient_data.recipient_code
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
                                bankName: recipient_data.details.bank_name,
                                accountNumber: recipient_data.details.account_number,
                                accountName: recipient_data.details.account_name,
                                bankCode: recipient_data.details.bank_code,
                                recipientCode: recipient_data.recipient_code
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

export const initiateWithdrawal = async (req, res) => {

    console.log("Inititating withdrawal".blue)
    const { withdrawal_amount, recipient_code } = req.body;

    if(!withdrawal_amount ||!recipient_code) {
        console.log("Withdrawal amount and recipient codes are required".red)
        return res.status(500).json({
            success: false,
            message: "Withdrawal amount and recipient codes are required"
        })
    }

    // const withdrawal_amount = Number(withdrawal_amount);

    const wallet= await Wallet.findOne({user: req.user._id})

    if(!wallet || wallet.currentBalance < withdrawal_amount){
        console.log(`Wallet balance: ${formatAmount(wallet.currentBalance)} less than withdrawal request amount of ${formatAmount(withdrawal_amount)}`.red)
        return res.status(200).json({
            success: true,
            message: `Wallet balance: ${formatAmount(wallet.currentBalance)} less than withdrawal request amount of ${formatAmount(withdrawal_amount)}`
        })
    }

    const reason = "Withdrawal from wallet"

    try {
        const response = await axios.post(
            `https://api.paystack.co/transfer`, 
            {
                source: "balance",  // Paystack balance
                amount: withdrawal_amount * 100,  // Amount in kobo (multiply NGN by 100)
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
            console.log(`Withdrawal request for amount ${withdrawal_amount} successfully submitted`)

            // Save new wihtdrawal request to database
            const newWithdrawal = new Withdrawal({
                user: req.user._id, 
                paystack_id: data.id,
                amount: data.amount / 100,
                recipient_code: recipient_code,
                transfer_code: data.transfer_code, 
                reference: data.reference,
                source: data.source,
                status: "pending",
                paystack_status: data.status, 
                transfer_success_id: data.transferSuccessId,
                transfer_trials: data.transfer_trials,
                reason: reason,
                failures: data.failures || null,
                paystack_createdAt: data.createdAt,
                paystack_updatedAt: data.updatedAt
            });

            await newWithdrawal.save();

            wallet.totalWithdrawn = Number(wallet.totalWithdrawn);
            const withdrawalAmountInNaira = Number(withdrawal_amount)

            wallet.currentBalance -= withdrawalAmountInNaira;
            wallet.totalWithdrawn += withdrawalAmountInNaira;
            await wallet.save();

            const formattedResponse = {
                amount: data.amount,
                status: "pending",

            }

            return res.status(200).json({
                success: true,
                message: `You have successfully requested for withdrawal for a total amount of ${withdrawal_amount} which is currently pending and you're expected to receive the funds within 25 minutes after the request`,
                transfer_details: formattedResponse  // Return transfer details
            });
        } else {
            console.log("Failed to initiate withdrawal")
            return res.status(400).json({
                success: false,
                message: "Failed to initiate withdrawal",
            });
        }

    } catch (error) {
        console.error("Error initiating withdrawal", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while initiating the withdrawal"
        });
    }
};
                                                 //  SPACE USERS WALLET TAB
export const spaceUserGetWallet = asyncHandler(async(req, res) => {
    console.log("Space user get wallet endpoint".blue)

    const user_id = req.user._id

    const existing_user = await User.findOne(user_id)

    if (!existing_user) {
        console.log("User does not exist".red);
        return res.status(404).json({
            success: false,
            message: "User does not exist"
        });
    }

    let walletMetrics = await Wallet.findOne({user: user_id})

    if(!walletMetrics) {
        const newWallet = new Wallet({
            user: user_id,
            current_balance: 0,
            total_withdrawn: 0,
            total_earned: 0
        })
        await newWallet.save()
        walletMetrics = newWallet
    }

    const updatedWalletMetrics = await Wallet.findOne({ user: user_id });

    const formattedWallet = {
        walletBalance: updatedWalletMetrics.currentBalance,
        allTimeFunding: updatedWalletMetrics.allTimeFunding
    }

    console.log("Space user wallet dashboard successfully retrieved".rainbow)
    return res.status(200).json({
        success: true,
        message: "Space user wallet dashboard successfully retrieved",
        data: {
            walletMetrics: formattedWallet
        }
    })
})

export const getTransactionsForSpaceUsersWallet = asyncHandler(async (req, res) => {
    console.log("Getting transaction history for space users".blue);

    const { paystackPaymentStatus } = req.query;
    const user_id = req.user._id; 

    if ( paystackPaymentStatus && !["pending", "success", "failed"].includes(paystackPaymentStatus)) {
        console.log("Invalid payment status".red);
        return res.status(400).json({
            success: false,
            message: "Invalid or missing payment status"
        });
    }

    let filter = { user: user_id };

    if (paystackPaymentStatus) {
        filter.paystackPaymentStatus = paystackPaymentStatus;
    }

    try {
        const bookings = await Booking.find(filter)
            .populate("listing")
            .sort({ createdAt: -1 });

        // Format booking data
        const formattedBookings = bookings.map((booking) => ({
            id: booking._id,
            propertyName: booking.listing?.propertyName || 'N/A',
            propertyType: booking.listing?.propertyType[0] || 'N/A',
            propertyImage: booking.listing?.bedroomPictures[0]?.secure_url || 'N/A',
            date: formatDate(booking.createdAt),
            amount: booking.chargePerNight + 2000,
            paymentStatus: booking.paystackPaymentStatus
        }));

        const fundinghistory = await FundingHistory.find({user: req.user._id})

        const formattedFundingHistory = fundinghistory.map((funding) => ({
            id: funding._id,
            propertyImage: funding.display_image,
            propertyName: "Wallet funding",
            propertyType: funding.mode_of_funding,
            date: formatDate(funding.createdAt),
            amount: funding.amount_to_fund,
            paymentStatus: funding.payment_status
        }))

        console.log("History", formattedFundingHistory)

        const formattedResponse = formattedBookings.concat(formattedFundingHistory).sort((a, b) => new Date(b.date)- new Date(a.date))

        console.log(`Bookings total: ${bookings.length}`)
        console.log(`Fundings total: ${fundinghistory.length}`)
        console.log(`Bookings retrieved successfully`.green);
        return res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            totalBookings: formattedBookings.length,
            data: formattedResponse
        });

    } catch (error) {
        console.error("Error retrieving bookings: ", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving bookings",
            error: error.message
        });
    }
});

export const spaceUserInitialiseFundWallet = async (req, res) => {
    console.log("Initializing Paystack payment for wallet funding...".green);
    const { amount, callBackUrl } = req.body;
    const user_id = req.user._id
    const email = req.user.email

    const requiredFields = {
        amount,
        callBackUrl, 
        user_id, 
        email
    };

    const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

    if (missingFields.length > 0) {
        console.log("Missing fields:", missingFields.join(', ').red);
        return res.status(400).json({
            success: false,
            message: `Missing the following field(s): ${missingFields.join(', ')}`
        });
    }

    const amountInKobo = amount * 100;

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amountInKobo,
                callback_url: callBackUrl,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { authorization_url, access_code, reference } = response.data.data;

        console.log("Response: ", response.data)

        const call_back_with_reference = `${callBackUrl}?reference=${reference}`;

        let wallet;

        wallet = await Wallet.findOne({user: user_id})
        if(!wallet) {
            console.log("Creating new wallet for user".yellow)
            wallet = new Wallet({
                user: user_id,
                currentBalance: 0,  
                totalWithdrawn: 0, 
                totalEarned: 0,
                allTimeFunding: 0
            });
        
            // Save the newly created wallet to the database
            await wallet.save();
            console.log("New wallet created for user".green);
        }

        const newFunding = await FundingHistory.create({
            user: user_id,
            display_image: "https://asset.cloudinary.com/dyshmmjis/d8e05916c710840313af682f1e9919ac",
            amount_to_fund: amount,
            payment_status: "pending",
            mode_of_funding: "web-payment",
            current_balance_before_funding: wallet.currentBalance,
            current_balance_after_funding: wallet.currentBalance + amount,
            all_time_wallet_funding: wallet.allTimeFunding + amount,
            authorization_url: authorization_url,
            access_code: access_code,
            paystack_ref: reference,
        })

        await newFunding.save()
    
        console.log(`Wallet funding transaction initialized for total amount of ${amount}`)
        res.status(200).json({
            success: true,
            message: `Wallet funding transaction initialized for total amount of ${amount}`,
            data: {
                authorization_url,
                access_code,
                reference,
                call_back_with_reference,
                amount: amount
            },
        });
    } catch (error) {
        console.error("Wallet funding transaction failed:", error.message);
        res.status(500).json({
            success: false,
            message: 'Wallet funding transaction failed', error,
        });
    }
};
export const spaceUserVerifyWalletFunding = async (req, res) => {
    const { reference } = req.body;  

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`
            }
        });

        const { status: paystackStatus, amount: paystackKoboAmount, customer } = response.data.data;

        if (paystackStatus !== 'success') {
            console.log("Payment failed".red);
            return res.status(400).json({
                success: false,
                message: 'Payment was not successful.',
            });
        }

        if (paystackStatus && paystackStatus === 'success') {
            console.log(response.data);
            const formattedPaystackResponse = {
                message: response.data.message,
                status: response.data.data.status,
                reference: response.data.data.reference,
                amount: response.data.data.amount,
                transaction_message: response.data.data.message,
                paid_at: response.data.data.paid_at,
                created_at: response.data.data.created_at,
                fees: response.data.data.fees,
                authorization_code: response.data.data.authorization.authorization_code,
                bank: response.data.data.authorization.bank,
                country_code: response.data.data.authorization.country_code,
                brand: response.data.data.authorization.brand,
                account_name: response.data.data.authorization.account_name,
                transaction_date: response.data.data.transaction_date
            };

            const fundinghistory = await FundingHistory.findOne({ paystack_ref: reference });
            if (!fundinghistory) {
                console.log("Payment was successful, but the funding history was not found in the database".red);
                return res.status(404).json({
                    success: false,
                    message: 'Payment was successful, but the funding history was not found.',
                });
            }

            if (fundinghistory.payment_status === 'successful') {
                console.log("Transaction has already been verified as successful".bgRed);
                return res.status(400).json({
                    success: false,
                    message: 'Transaction has already been verified as successful.',
                });
            }

            fundinghistory.payment_status = "successful";
            await fundinghistory.save()

            const existing_user = await User.findOne({ email: req.user.email });
            if (!existing_user) {
                console.log("User who initiated this transaction can't be found again".red);
                return res.status(500).json({
                    success: false,
                    message: "User who initiated this transaction can't be found again"
                });
            }

            const wallet = await Wallet.findOne({ user: req.user._id });
            wallet.currentBalance += (paystackKoboAmount / 100);  // Corrected line
            wallet.allTimeFunding += (paystackKoboAmount / 100);  // Corrected line
            await wallet.save();
            
            const formattedRes = {
                current_balance: wallet.currentBalance,
                all_time_funding: wallet.allTimeFunding
            }

            console.log("Payment verified and wallet updated successfully".rainbow);
            return res.status(200).json({
                success: true,
                message: "Payment verified and wallet updated successfully",
                wallet: formattedRes
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
