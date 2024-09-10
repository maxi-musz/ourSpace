import asyncHandler from "../../middleware/asyncHandler.js";
import User from "../../models/userModel.js";
import Listing from "../../models/listingModel.js";
import Waitlist from "../../models/waitlistModel.js";

const getAdminDashboard = asyncHandler(async (req, res) => {
    console.log("Fetching admin dashboard data...".yellow);

    try {
        // Fetch total number of users
        const users = await User.find();
        const totalUsers = users.length;
        console.log(`Total users found: ${totalUsers}`.blue);

        // Fetch total number of active listings
        const listedProperties = await Listing.find({ });
        const totalProperties = listedProperties.length;
        console.log(`Total active listings found: ${totalProperties}`.green);

        // Fetch total number of users on the waitlist
        const waitlist = await Waitlist.find();
        const totalWaitlist = waitlist.length;
        console.log(`Total waitlist users found: ${totalWaitlist}`.yellow);

        // Respond with the dashboard data
        res.status(200).json({
            success: true,
            message: "Dashboard successfully retrieved",
            data: {
                totalUsers,
                totalProperties,
                totalWaitlist
            }
        });
    } catch (error) {
        console.error("Error retrieving admin dashboard data:", error.message.red);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard data",
            error: error.message
        });
    }
});

export {
    getAdminDashboard
}