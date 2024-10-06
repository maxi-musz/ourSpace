import opencage from 'opencage-api-client';

import asyncHandler from "../../middleware/asyncHandler.js"
import Listing from "../../models/listingModel.js"
import cloudinaryConfig from '../../uploadUtils/cloudinaryConfig.js';



const getAllListings = asyncHandler(async (req, res) => {
    console.log("Getting all listings...".yellow);

    const { listingStatus } = req.query;
    let filter = {};

    if (listingStatus) {
        const validStatuses = ["approved", "rejected", "pending", "active", "inactive", "draft", "archived", "blocked"];
        if (validStatuses.includes(listingStatus)) {
            filter.listingStatus = listingStatus;
            console.log(`Filtering listings by listingStatus: ${listingStatus}`.cyan);
        } else {
            console.log(`Invalid listingStatus provided: ${listingStatus}`.red);
            return res.status(400).json({
                success: false,
                message: "Invalid status provided. Must be one of: 'approved', 'rejected', 'pending', 'active', 'inactive', 'draft', 'archived', 'blocked'."
            });
        }
    }

    try {
        const listings = await Listing.find(filter)
            .populate({
                path: 'user', // Assuming 'user' is the field name in the Listing model referencing the User model
                select: 'firstName' // Only select the firstName field from the User model
            });

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

const getListingById = asyncHandler(async (req, res) => {
    console.log("Getting a single listing by ID...".yellow);

    const { id } = req.params; // Extract the listing ID from the request parameters

    try {
        const listing = await Listing.findById(id)
            .populate({
                path: 'user', // Assuming 'user' is the field name in the Listing model referencing the User model
                select: 'firstName' // Only select the firstName field from the User model
            });

        // Check if the listing exists
        if (!listing) {
            console.log(`Listing not found with ID: ${id}`.red);
            return res.status(404).json({
                success: false,
                message: `Listing not found with ID: ${id}`
            });
        }

        console.log(`Listing successfully retrieved with ID: ${id}`.green);
        res.status(200).json({
            success: true,
            message: "Listing successfully retrieved",
            data: listing
        });

    } catch (err) {
        console.log(`Error retrieving listing: ${err.message}`.red);
        res.status(400).json({
            success: false,
            message: `Error getting listing: ${err.message || err}`,
        });
    }
});

const updateListingStatus = asyncHandler(async (req, res) => {
    console.log("Updating listing status".yellow);

    try {
        const { listingId, newListingStatus } = req.query;
        console.log(newListingStatus, listingId)

        if (!newListingStatus || !["approved", "rejected",'active', 'inactive', 'pending', 'draft', 'archived', 'blocked'].includes(newListingStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid listing status'
            });
        }

        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }

        if(newListingStatus === "approved" || newListingStatus === "active") {
            listing.listingStatus = newListingStatus;
            listing.status = "listed"

            await listing.save();

            res.status(200).json({
                success: true,
                message: 'Listing status updated successfully',
                data: listing
            });
        } else {
            listing.listingStatus = newListingStatus;
            listing.status = "unlisted"

            await listing.save();

            res.status(200).json({
                success: true,
                message: 'Listing status updated successfully',
                data: listing
            });
        }
    } catch (error) {
        console.error(`Error updating listing status: ${error.message}`.red);
        return res.status(500).json({
            success: false,
            message: `Server error: ${error.message}`,
            error
        });
    }
});

const tempUpdateListingStatus = asyncHandler(async (req, res) => {
    console.log("Updating listing status".yellow);

    try {
        const listings = await Listing.find()

        // Loop through each listing and update the status
        for (let listing of listings) { // Use let to allow reassignment
            if (listing.listingStatus === "approved") {
                listing.status = "listed";
            } else {
                listing.status = "unlisted";
            }
            await listing.save(); // Save the updated listing to the database
        }     
        console.log("Status for each listing successfully updated".green);
        return res.status(201).json({
            success: true,
            message: "Status update for each listing successful"
        });

    } catch (error) {
        console.log("Error", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
});

const updateStatus = asyncHandler(async (req, res) => {
    console.log("Updating status".yellow);

    try {
        const listings = await Listing.find();

        if (!listings || listings.length === 0) {
            console.log("No listings found".red);
            return res.status(404).json({
                success: false,
                message: "No listings found"
            });
        }

        console.log(`Total of ${listings.length} listings found`.green);

        // Loop through each listing and update the status
        for (let listing of listings) { // Use let to allow reassignment
            if (listing.status === "approved") {
                listing.status = "listed";
            } else {
                listing.status = "unlisted";
            }
            await listing.save(); // Save the updated listing to the database
        }

        console.log("Status for each listing successfully updated".green);
        return res.status(201).json({
            success: true,
            message: "Status update for each listing successful"
        });

    } catch (error) {
        console.log("Error", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
});




export { 
    getListingById,
    getAllListings,
    updateListingStatus,
    updateStatus,
    tempUpdateListingStatus
}