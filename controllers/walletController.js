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


export {
    getWallet,
    getSingleBookingFromWalletDashboard,
    getBookingPDF
}