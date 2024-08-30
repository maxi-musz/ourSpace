import asyncHandler from "../../middleware/asyncHandler.js";
import Waitlist from "../../models/waitlistModel.js";

const getAllWaitlistData = asyncHandler(async (req, res) => {
    console.log("Getting all waitlist data...".yellow);

    // Extract userType from query parameters
    const { userType } = req.query;
    let filter = {};

    // Apply filter if userType is provided
    if (userType) {
        if (["space-user", "space-owner"].includes(userType)) {
            filter.userType = userType;
            console.log(`Filtering users by userType: ${userType}`.cyan);
        } else {
            console.log(`Invalid userType provided: ${userType}`.red);
            return res.status(400).json({
                success: false,
                message: "Invalid userType provided. Must be 'space-owner', 'space-user'"
            });
        }
    }

    try {
        const waitlist = await Waitlist.find(filter);
        console.log("All waitlists data successfully retrieved".america);
        res.status(200).json({
            success: true,
            message: "All waitlists data successfully retrieved",
            total: waitlist.length,
            data: waitlist
        });

    } catch (err) {
        console.log(`Error retrieving waitlists data: ${err.message}`.red);
        res.status(400).json({
            success: false,
            message: `Error getting waitlists data: ${err.message || err}`,
        });
    }
});

export {
    getAllWaitlistData
}