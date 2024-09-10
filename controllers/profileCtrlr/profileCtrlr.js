import asyncHandler from "../../middleware/asyncHandler.js"
import User from "../../models/userModel.js";
import Notification from "../../models/notificationModel.js";
import Booking from "../../models/bookingModel.js"
import Message from "../../models/messageModel.js"
import Listing from "../../models/listingModel.js";


const getSpaceUserDashboard = asyncHandler(async (req, res) => {
    console.log("Getting space user dashboard".yellow);

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
            bookingStatus: 'upcoming',
        })
        .populate({
            path: 'listing',
            select: 'propertyId propertyName propertyLocation livingRoomPictures propertyLocation',
        });

        // Map through upcomingBookings correctly
        const formattedUpcomings = upcomingBookings.map(upcoming => ({
            propertyName: upcoming.listing.propertyName,
            bookingStatus: upcoming.bookingStatus,
            status: upcoming.paystackPaymentStatus,
            apartmentNumber: upcoming.listing.propertyLocation.apartmentNumber,
            propertyImage: upcoming.listing.livingRoomPictures.length > 0 
                ? upcoming.listing.livingRoomPictures[0] 
                : 'default-image-url', // Fallback for missing images
            timestamp: upcoming.createdAt,
        }));

        res.status(200).json({
            success: true,
            message: "Dashboard successfully retrieved",
            data: {
                user,
                notifications,
                upcomingBookings: formattedUpcomings
            },
        });

    } catch (error) {
        console.error('Error fetching user dashboard:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the user dashboard',error
        });
    }
});


const getAllSUBookings = asyncHandler(async (req, res) => {
    console.log("Getting all space user bookings".yellow);

    const user = req.user;
    const { bookingStatus } = req.query;

    const allowedStatuses = ['pending', 'upcoming', 'in-progress', 'completed', 'cancelled'];

    if (bookingStatus && !allowedStatuses.includes(bookingStatus)) {
        console.log(`Invalid bookingStatus. Allowed values are: ${allowedStatuses.join(', ')}.`.red);
        return res.status(400).json({
            success: false,
            message: `Invalid bookingStatus. Allowed values are: ${allowedStatuses.join(', ')}.`,
        });
    }

    let filter = { user };

    if (bookingStatus) {
        filter.bookingStatus = bookingStatus;
    }

    const bookings = await Booking.find(filter)
        .populate({
            path: 'listing',
            select: 'propertyId propertyName propertyLocation livingRoomPictures chargePerNight bedroomTotal totalGuestsAllowed',
        });

    if (bookings.length < 1) {
        console.log("Total of 0 bookings found".red);
        return res.status(200).json({
            success: true,
            message: "You currently have no bvookings at the moment, checkout some nice apartment closeby, make payment for the one of your choice and enjoy seamless stay",
            data: []
        });
    }

    const formattedBookings = bookings.map(booking => ({
        id: booking.listing._id,
        propertyId: booking.listing.propertyId,
        propertyName: booking.listing.propertyName,
        propertyLocation: booking.listing.propertyLocation,
        bookingStatus: booking.bookingStatus,
        chargePerNight: booking.listing.chargePerNight,
        bedroomTotal: booking.listing.bedroomTotal,
        totalGuestsAllowed: booking.listing.totalGuestsAllowed, 
        propertyImage: booking.listing.livingRoomPictures[0],
        timestamp: booking.createdAt,
    }));
    console.log(formattedBookings.price)
    

    console.log(`Total of ${bookings.length} bookings found`.magenta);
    return res.status(200).json({
        success: true,
        message: `Total of ${bookings.length} bookings found`,
        data: formattedBookings,
    });
});

const getSUBookingHistory = asyncHandler(async (req, res) => {
    console.log("Getting all space user booking history".yellow);

    const user = req.user;

    const { paystackPaymentStatus } = req.query;

    const allowedStatuses = ['pending', 'success', 'failed'];

    if (paystackPaymentStatus && !allowedStatuses.includes(paystackPaymentStatus)) {
        console.log(`Invalid paystackPaymentStatus. Allowed values are: ${allowedStatuses.join(', ')}.`.red);
        return res.status(400).json({
            success: false,
            message: `Invalid paystackPaymentStatus. Allowed values are: ${allowedStatuses.join(', ')}.`,
        });
    }

    let filter = { user };

    if (paystackPaymentStatus) {
        filter.paystackPaymentStatus = paystackPaymentStatus;
    }

    const bookings = await Booking.find(filter)
        .populate({
            path: 'listing',
            select: 'propertyName livingRoomPictures',
        });

    if (bookings.length < 1) {
        console.log("Total of 0 bookings found".red);
        return res.status(200).json({
            success: true,
            message: "You currently have no bvookings at the moment, checkout some nice apartment closeby, make payment for the one of your choice and enjoy seamless stay",
            data: []
        });
    }

    const formattedBookings = bookings.map(booking => ({
        livingRoomPictures: booking.listing.livingRoomPictures[0],
        propertyName: booking.listing.propertyName,
        timestamp: booking.createdAt,
        amountPaid: booking.amount,
        paystackPaymentStatus: booking.paystackPaymentStatus,
    }));
    
    console.log(`Total of ${bookings.length} booking history found`.magenta);
    return res.status(200).json({
        success: true,
        message: `Total of ${bookings.length} booking history found`,
        data: formattedBookings,
    });
});



const getAllNotifications = asyncHandler(async(req, res)=> {
    console.log("getting all notifications for user ".yellow)

    const user = req.user

    if(!user) {
        console.log("User not found".red)
        return res.status(400).json({
            success: false,
            message: "User not found"
        })
    }

    try {

        const notifications = await Notification.find({user})

        if(notifications.length < 1) {
            console.log("Total of 0 notifications found".red)
            return res.status(200).json({
                success: true,
                message: "Total of 0 notificatons found"
            })
        }

        console.log(`Total of ${notifications.length} found`.red)
        return res.status(200).json({
            success: true,
            message: `Total of ${notifications.length} found`,
            data: notifications
        })
        
    } catch (error) {
        console.log("Error gettingnotifications", error)
        res.status(400).json({
            success: false,
            message: "Error gettingnotifications", error
        })
    }
})


//                                                              space owners
const getSpaceOwnerDashboard = asyncHandler(async (req, res) => {
    console.log("Getting space owner dashboard".yellow);

    const userId = req.user;

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const listings = await Listing.find({ user: userId });

        const currentDate = new Date().toISOString().split('T')[0];

        const activeBookings = await Booking.find({
            listing: { $in: await Listing.find({ user: userId }).select('_id') },
            paystackPaymentStatus: 'success',
            bookedDays: { $elemMatch: { $gte: currentDate } },
            paystackPaymentStatus: 'success',
        })

        const messages = await Message.find({ receiver: userId })
            .populate({
                path: 'sender', 
                select: 'profilePicture firstName lastName',
            })
            .populate({
                path: 'listing', 
                select: 'propertyName',
            })
            .sort({ timestamp: -1 });

        const formattedMessages = messages.map(message => ({
            senderProfilePicture: message.sender.profilePicture || 'default-profile-url',
            senderName: `${message.sender.firstName} ${message.sender.lastName}`,
            propertyName: message.listing ? message.listing.propertyName : 'Unknown Property',
            latestMessage: message.content,
            sentAt: message.timestamp,
        }));

        res.status(200).json({
            success: true,
            message: "Dashboard successfully retrieved",
            data: {
                totalListings: listings.length,
                currentSpaceUsers: activeBookings.length,
                messages: formattedMessages,
                user,
            },
        });

    } catch (error) {
        console.error('Error fetching user dashboard:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the user dashboard',
            error: error.message,
        });
    }
});


const format = asyncHandler(async(req, res)=> {
    console.log("getting all space user bookings".yellow)
})



export {
    getSpaceUserDashboard,
    getAllSUBookings,
    getAllNotifications,
    getSUBookingHistory,
    // space owner
    getSpaceOwnerDashboard,
}