import asyncHandler from "../../middleware/asyncHandler.js";
import Waitlist from "../../models/waitlistModel.js";

const getAllWaitlistData = asyncHandler(async (req, res) => {
    console.log("Getting all waitlist data...".yellow);

    // Extract type from query parameters
    const { type } = req.query;
    let filter = {};

    // Apply filter if type is provided
    if (type) {
        if (["space-user", "space-owner"].includes(type)) {
            filter.type = type;  // Use filter directly for type
            console.log(`Filtering users by type: ${type}`.cyan);
        } else {
            console.log(`Invalid type provided: ${type}`.red);
            return res.status(400).json({
                success: false,
                message: "Invalid type provided. Must be 'space-owner' or 'space-user'",
            });
        }
    }

    try {
        const waitlist = await Waitlist.find(filter);  // Use filter directly here
        console.log("All waitlists data successfully retrieved".green);
        res.status(200).json({
            success: true,
            message: "All waitlists data successfully retrieved",
            total: waitlist.length,
            data: waitlist,
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