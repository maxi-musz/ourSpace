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
<<<<<<< HEAD
            filter.type = type;
=======
            filter.type = type;  // Use filter directly for type
>>>>>>> ourspace/test
            console.log(`Filtering users by type: ${type}`.cyan);
        } else {
            console.log(`Invalid type provided: ${type}`.red);
            return res.status(400).json({
                success: false,
<<<<<<< HEAD
                message: "Invalid type provided. Must be 'space-owner', 'space-user'"
=======
                message: "Invalid type provided. Must be 'space-owner' or 'space-user'",
>>>>>>> ourspace/test
            });
        }
    }

    try {
<<<<<<< HEAD
        const waitlist = await Waitlist.find(filter);
        console.log("All waitlists data successfully retrieved".america);
=======
        const waitlist = await Waitlist.find(filter);  // Use filter directly here
        console.log("All waitlists data successfully retrieved".green);
>>>>>>> ourspace/test
        res.status(200).json({
            success: true,
            message: "All waitlists data successfully retrieved",
            total: waitlist.length,
<<<<<<< HEAD
            data: waitlist
        });

=======
            data: waitlist,
        });
>>>>>>> ourspace/test
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