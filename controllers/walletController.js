import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Wallet from "../models/walletModel.js";
import { formatAmount, formatDate } from "../utils/helperFunction.js";

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

    console.log(`Wallet: ${walletMetrics}`)

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

export {
    getWallet
}