import asyncHandler from "../../middleware/asyncHandler.js"
import User from "../../models/userModel.js";
import Notification from "../../models/notificationModel.js";
import Booking from "../../models/bookingModel.js"

const getSpaceUserDashboard = asyncHandler(async (req, res) => {
    console.log("Getting space user dashboard".yellow)
    const userId = req.user; 
    try {

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const notifications = await Notification.find({ user: userId });

        const upcomingBookings = await Booking.find({ 
            user: userId, 
            bookingStatus: 'upcoming' 
        });

        res.status(200).json({
            success: true,
            message: "Dashboard successfully retrieved",
            data: {
                user,
                notifications,
                upcomingBookings
            },
        });
    } catch (error) {
        console.error('Error fetching user dashboard:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the user dashboard',
        });
    }
});

const getAllSUBookings = asyncHandler(async (req, res) => {
    console.log("Getting all space user bookings".yellow);

    const user = req.user;
    const { bookingStatus } = req.query; 

    const allowedStatuses = ['pending', 'upcoming', 'in-progress', 'completed', 'cancelled'];

    if (bookingStatus && !allowedStatuses.includes(bookingStatus)) {
        console.log(`Invalid bookingStatus. Allowed values are: ${allowedStatuses.join(', ')}.`.red)
        return res.status(400).json({
            success: false,
            message: `Invalid bookingStatus. Allowed values are: ${allowedStatuses.join(', ')}.`,
        });
    }

    let filter = { user };

    if (bookingStatus) {
        filter.bookingStatus = bookingStatus;
    }

    const bookings = await Booking.find(filter);

    if (bookings.length < 1) {
        console.log("Total of 0 bookings found".red);
        return res.status(200).json({
            success: true,
            message: "Total of 0 bookings found",
        });
    }

    console.log(`Total of ${bookings.length} bookings found`.magenta);
    return res.status(200).json({
        success: true,
        message: `Total of ${bookings.length} bookings found`,
        data: bookings,
    });
});



const format = asyncHandler(async(req, res)=> {
    console.log("getting all space user bookings".yellow)
})



export {
    getSpaceUserDashboard,
    getAllSUBookings
}