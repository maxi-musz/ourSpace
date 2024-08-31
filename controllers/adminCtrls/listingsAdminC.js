import opencage from 'opencage-api-client';

import asyncHandler from "../../middleware/asyncHandler.js"
import Listing from "../../models/listingModel.js"
import formatListingData from "../../utils/formatListingData.js";
import cloudinaryConfig from '../../uploadUtils/cloudinaryConfig.js';

const getCoordinates = async (address) => {
    try {
      const response = await opencage.geocode({ q: address, key: process.env.OPENCAGE_API_KEY });
      if (response.results.length > 0) {
        const { lat, lng } = response.results[0].geometry;
        return { latitude: lat, longitude: lng };
      } else {
        throw new Error('No results found');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error.message);
      throw error;
    }
};

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

const uploadListingImagesToCloudinary = async (items) => {
    return Promise.all(items.map(async (item) => {
      if (typeof item === 'string' && item.startsWith('http')) {
        // The item is an existing URL, return it as is
        return item;
      } else {
        // The item is a file, upload it to Cloudinary
        const result = await cloudinaryConfig.uploader.upload(item.path, {
          folder: 'ourSpace/listing-images',
        });
        return result.secure_url; 
      }
    }));
};

const editListing = asyncHandler(async (req, res) => {
    const listingId = req.params.id;
    const userId = req.user._id.toString();

    try {
        console.log('Editing listing...');

        // Fetch the existing listing
        const listing = await Listing.findById(listingId);

        if (!listing) {
            console.log("Listing not found".red);
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        // Ensure the user owns the listing
        if (listing.user.toString() !== userId || !user.isAdmin) {
            console.log("Unauthorized access attempt".red);
            return res.status(403).json({
                success: false,
                message: "You do not have permission to edit this listing"
            });
        }

        // Extract and format fields from request body using the utility function
        const formattedData = formatListingData(req);

        // If the address is updated, get the new latitude and longitude
        if (formattedData.propertyLocation) {
            const { address, city, state } = formattedData.propertyLocation;
            const fullAddress = `${address}, ${city}, ${state}`;
            const { latitude, longitude } = await getCoordinates(fullAddress);

            formattedData.propertyLocation.latitude = latitude;
            formattedData.propertyLocation.longitude = longitude;
        }

        // Process image updates
        let updatedImages = {};

        const processImages = async (field) => {
            if (req.body[field] || req.files[field]) {
                const existingImages = Array.isArray(req.body[field]) ? req.body[field] : [];
                const newImages = req.files[field] || [];
                updatedImages[field] = await uploadListingImagesToCloudinary([...existingImages, ...newImages]);
            }
        };

        await processImages('bedroomPictures');
        await processImages('livingRoomPictures');
        await processImages('bathroomToiletPictures');
        await processImages('kitchenPictures');
        await processImages('facilityPictures');
        await processImages('otherPictures');

        // Merge the updated fields with the existing listing
        const updatedListing = await Listing.findByIdAndUpdate(
            listingId,
            {
                ...formattedData,
                ...updatedImages
            },
            { new: true, runValidators: true }
        );

        const currentListing = await Listing.findById(listingId)

        console.log("Listing successfully updated".magenta);
        res.status(200).json({
            success: true,
            message: "Listing successfully updated",
            data: currentListing
        });

    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({
            success: false,
            message: `Server error: ${error.message}`,
            error
        });
    }
});

const updateListingStatus = asyncHandler(async (req, res) => {
    console.log("Updating listing status".yellow);

    try {
        const { listingId } = req.params;
        const { newListingStatus } = req.body;

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

        listing.listingStatus = newListingStatus;
        listing.status = "listed"


        await listing.save();

        res.status(200).json({
            success: true,
            message: 'Listing status updated successfully',
            data: listing
        });
    } catch (error) {
        console.error(`Error updating listing status: ${error.message}`.red);
        return res.status(500).json({
            success: false,
            message: `Server error: ${error.message}`,
            error
        });
    }
});





export { 
    getListingById,
    getAllListings,
    editListing,
    updateListingStatus
}