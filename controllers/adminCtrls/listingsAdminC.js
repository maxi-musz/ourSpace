import asyncHandler from "../../middleware/asyncHandler.js"
import Listing from "../../models/listingModel.js"

const getAllListings = asyncHandler(async (req, res) => {
    console.log("Getting all listings...".yellow);

    // Extract listingStatus from query parameters
    const { listingStatus } = req.query;
    let filter = {};

    // Apply filter if listingStatus is provided
    if (listingStatus) {
        if (["approved", "rejected", "pending", "active", "inactive","draft", "archived", "blocked"].includes(listingStatus)) {
            filter.listingStatus = listingStatus;
            console.log(`Filtering listings by listingStatus: ${listingStatus}`.cyan);
        } else {
            console.log(`Invalid listingStatus provided: ${listingStatus}`.red);
            return res.listingStatus(400).json({
                success: false,
                message: "Invalid status provided. Must be 'active', 'inactive', or 'pending'."
            });
        }
    }

    try {
        const listings = await Listing.find(filter);
        console.log("All listings successfully retrieved".america);
        res.status(200).json({
            success: true,
            message: "All listings successfully retrieved",
            total: listings.length,
            data: listings
        });

    } catch (err) {
        console.log(`Error retrieving listings: ${err.message}`.red);
        res.status(400).json({
            success: false,
            message: `Error getting listings: ${err.message || err}`,
        });
    }
});

export {
    getAllListings,
}