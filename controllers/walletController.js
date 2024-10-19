import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Wallet from "../models/walletModel.js";
import { formatAmount, formatDate } from "../utils/helperFunction.js";

const getWallet = asyncHandler(async (req, res) => {
    console.log("Getting wallet dashboard...".blue);

    const walletMetrics = await Wallet.find({user: req.user._id})

    try {
        // Fetch bookings and populate related models (listing and user)
        const bookings = await Booking.find({ 
            spaceOwnerId: req.user._id,
            paystackPaymentStatus: "success"
         })
            .populate('listing')
            .populate('user');

        console.log(`Total of ${bookings.length} bookings found`.green);

        // Format the bookings into the desired format
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
                    currentBalance: `#${walletMetrics.currentBalance}`,
                    witdrawn: `#${walletMetrics.totalWithdrawn}`,
                    allTimeEarned: `#${walletMetrics.allTimeEarned}`
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