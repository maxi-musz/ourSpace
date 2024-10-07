import opencage from 'opencage-api-client';
import asyncHandler from "../middleware/asyncHandler.js";
import Listing from "../models/listingModel.js";
import cloudinaryConfig from "../uploadUtils/cloudinaryConfig.js";
import { formatSaveForLaterListingData, formatListingData } from "../utils/formatListingData.js"
import Booking from '../models/bookingModel.js';
import DraftListing from '../models/draftListingModel.js';

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

// Generate a unique listing ID
function generateListingId() {
  const randomDigits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
  return `OS${randomDigits}`;
}

// UPLOAD IMAGES
const uploadListingImagesToCloudinary = async (items) => {
  return Promise.all(items.map(async (item) => {
    if (typeof item === 'string' && item.startsWith('http')) {
     
      return { secure_url: item, public_id: null };
    } else {
      
      const result = await cloudinaryConfig.uploader.upload(item.path, {
        folder: 'ourSpace/listing-images',
      });
      return {
        secure_url: result.secure_url,
        public_id: result.public_id
      };
    }
  }));
};

const deleteImagesFromCloudinary = async (publicIds) => {
  return Promise.all(publicIds.map(async (publicId) => {
    if (publicId) {
      try {
        const result = await cloudinaryConfig.uploader.destroy(publicId);
        console.log(`Image with public_id ${publicId} deleted:`, result);
        return result;
      } catch (error) {
        console.error(`Error deleting image with public_id ${publicId}:`, error);
        throw error;
      }
    }
  }));
};

const allowedPropertyTypes = ["house", "apartment", "resort", "guest-house", "office-space", 'bungalow', 'villa', 'loft'];

const createListing = asyncHandler(async (req, res) => {
  console.log("Creating a new listing".blue);
  const userId = req.user._id.toString();

  if (req.user.userType !== "space-owner") {
    console.log("Only space owners can create a listing".red);
    return res.status(404).json({
      success: false,
      message: "Only space owners can create new listing"
    });
  }

  // Validate property type against the allowed values
  const propertyTypes = req.body.propertyType; // This can be a string or an array
  let propertyTypeArray;

  // Check if propertyTypes is a string and split it into an array
  if (typeof propertyTypes === 'string') {
    propertyTypeArray = propertyTypes.split(',').map(type => type.trim());
  } else if (Array.isArray(propertyTypes)) {
    propertyTypeArray = propertyTypes; // It's already an array
  } else {
    console.log("Invalid property type format".red);
    return res.status(400).json({
      success: false,
      message: "Property type must be a string or an array of strings."
    });
  }

  // Validate each property type against the allowed values
  const invalidPropertyTypes = propertyTypeArray.filter(type => !allowedPropertyTypes.includes(type));
  if (invalidPropertyTypes.length > 0) {
    console.log(`Invalid property types: ${invalidPropertyTypes.join(', ')}`.red);
    return res.status(400).json({
      success: false,
      message: `Invalid property type(s): ${invalidPropertyTypes.join(', ')}. Allowed types are: ${allowedPropertyTypes.join(', ')}`
    });
  }

  let bedroomPictures = [];
  let livingRoomPictures = [];
  let bathroomToiletPictures = [];
  let kitchenPictures = [];
  let facilityPictures = [];
  let otherPictures = [];

  // Define the image categories required
  const imageCategories = [
    'bedroomPictures', 
    'livingRoomPictures', 
    'bathroomToiletPictures', 
    'kitchenPictures', 
    'facilityPictures', 
    'otherPictures'
  ];

  // Centralized image deletion function
  const deleteUploadedImages = async (imageArrays) => {
    const allPublicIds = imageArrays.flat().map(image => image.public_id);
    if (allPublicIds.length > 0) {
      try {
        await deleteImagesFromCloudinary(allPublicIds);
      } catch (deleteError) {
        console.error("Error during image deletion:", deleteError);
      }
    }
  };

  try {
    // Validate that all required image categories have at least one image
    const missingCategories = imageCategories.filter(category => !req.files[category]);
    if (missingCategories.length > 0) {
      console.log("At least one image is required from the image sections".red);
      return res.status(400).json({
        success: false,
        message: `At least one image is required from the image sections: ${missingCategories.join(', ')}`
      });
    }

    console.log('Formatting listings');
    const formattedData = formatListingData(req);

    let latitude, longitude;

    // Check if latitude and longitude are already provided
    if (formattedData.propertyLocation.latitude && formattedData.propertyLocation.longitude) {
      latitude = formattedData.propertyLocation.latitude;
      longitude = formattedData.propertyLocation.longitude;
      console.log(`Latitude and Longitude already provided: ${latitude}, ${longitude}`.cyan);
    } else {
      // Fetch coordinates based on the address
      try {
        const { address, city, state } = formattedData.propertyLocation;
        const fullAddress = `${address}, ${city}, ${state}`;
        const coordinates = await getCoordinates(fullAddress);

        latitude = coordinates.latitude;
        longitude = coordinates.longitude;

        console.log(`Latitude: ${latitude} and Longitude: ${longitude} obtained`.cyan);
      } catch (error) {
        console.log(`Error getting coordinates: ${error}`.red);
        return res.status(500).json({ success: false, message: `Error getting coordinates: ${error.message}` });
      }
    }

    console.log(`Latitude: ${latitude} \nLongitude: ${longitude}`.yellow);

    // Upload images concurrently
    try {
      console.log("Uploading pictures".cyan);
      const uploadPromises = imageCategories.map(category =>
        uploadListingImagesToCloudinary(req.files[category])
      );

      const [bedroomPics, livingRoomPics, bathroomToiletPics, kitchenPics, facilityPics, otherPics] = await Promise.all(uploadPromises);

      // Assign images to variables
      bedroomPictures = bedroomPics;
      livingRoomPictures = livingRoomPics;
      bathroomToiletPictures = bathroomToiletPics;
      kitchenPictures = kitchenPics;
      facilityPictures = facilityPics;
      otherPictures = otherPics;

      console.log("Pictures uploaded".yellow);
    } catch (error) {
      console.error('Error uploading images:', error.stack || JSON.stringify(error, null, 2));
      // Delete uploaded images in case of failure
      await deleteUploadedImages([bedroomPictures, livingRoomPictures, bathroomToiletPictures, kitchenPictures, facilityPictures, otherPictures]);

      return res.status(500).json({
        success: false,
        message: `Error uploading listing images: ${error.message || error}`
      });
    }

    // Create a new listing in the database
    const newListingData = {
      ...formattedData,
      user: userId,
      propertyId: generateListingId(),
      propertyLocation: {
        ...formattedData.propertyLocation,
        latitude,
        longitude,
      },
      bedroomPictures,
      livingRoomPictures,
      bathroomToiletPictures,
      kitchenPictures,
      facilityPictures,
      otherPictures,
      propertyType: propertyTypeArray // Store the validated property types
    };

    if (req.body.listingId) {
      newListingData._id = req.body.listingId;
    }

    const newListing = await Listing.create(newListingData);

    if (req.body.listingId) {
      try {
        const deletedDraft = await DraftListing.findOneAndDelete({
          _id: req.body.listingId,
        });
  
        if (deletedDraft) {
          console.log("Draft listing deleted successfully".green);
        }
      } catch (deleteDraftError) {
        console.error("Error deleting draft listing:", deleteDraftError);
      }
    }

    console.log("New Listing successfully created".magenta);
    return res.status(201).json({
      success: true,
      message: "You've successfully created a new listing",
      data: newListing
    });
  } catch (error) {
    console.error('Error creating property listing:', error.stack || error);

    // Delete uploaded images if any error occurs after the upload
    await deleteUploadedImages([bedroomPictures, livingRoomPictures, bathroomToiletPictures, kitchenPictures, facilityPictures, otherPictures]);

    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error
    });
  }
});

const saveListingForLater = asyncHandler(async (req, res) => {
  console.log("Saving new listing to draft".yellow);
  const userId = req.user._id.toString();

  const listingId = req.body.listingId;
  let existingListing = null;

  // Check if the listing exists
  if (listingId) {
    existingListing = await DraftListing.findById(listingId);
    if (!existingListing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
  }

  let removedImages = req.body.removedImages;

  // Handle removed images
  if (removedImages) {
    console.log("Removing images", removedImages);
    if (typeof removedImages === 'string') {
      try {
        removedImages = JSON.parse(removedImages);
      } catch (error) {
        console.error('Error parsing removedImages:', error);
        removedImages = removedImages.split(',').map((image) => image.trim());
      }
    }

    if (!Array.isArray(removedImages)) {
      console.log("Removed images should be an array".red);
      return res.status(400).json({
        success: false,
        message: "Removed images should be an array",
      });
    }

    try {
      console.log("Deleting images from Cloudinary".red);
      await deleteImagesFromCloudinary(removedImages);
    } catch (error) {
      console.error("Error during image deletion:", error);
      return res.status(500).json({
        success: false,
        message: `Error deleting images: ${error.message}`,
      });
    }
  }

  // Format the listing data using the same logic as createListing
  const formattedData = formatSaveForLaterListingData(req);

  let existingAvailableAmenities = existingListing ? existingListing.availableAmenities : {};
  const newAvailableAmenities = {
    ...existingAvailableAmenities,
    ...formattedData.availableAmenities // This will only update provided fields in availableAmenities
  };
  formattedData.availableAmenities = newAvailableAmenities;

  let existingArrivalDepartureDetails = existingListing ? existingListing.arrivalDepartureDetails : {};
  const newArrivalDepartureDetails = {
    ...existingArrivalDepartureDetails,
    ...formattedData.arrivalDepartureDetails
  };
  formattedData.arrivalDepartureDetails = newArrivalDepartureDetails;

  // Define the image categories required
  const imageCategories = [
    'bedroomPictures',
    'livingRoomPictures',
    'bathroomToiletPictures',
    'kitchenPictures',
    'facilityPictures',
    'otherPictures',
  ];

  let updatedImages = {};
  try {
    console.log("Uploading new images and merging with existing images".blue);

    for (let category of imageCategories) {
      // Upload new images if they exist in the request
      const newImages = req.files?.[category]
        ? await uploadListingImagesToCloudinary(req.files[category])
        : null;

      // Retain existing images from the listing that are not in the removedImages list
      const existingImages = existingListing && existingListing[category]
        ? existingListing[category].filter(
            (image) => !removedImages || !removedImages.includes(image.public_id)
          )
        : [];

      // If new images are provided, merge them with the existing ones; otherwise, keep only existing images
      updatedImages[category] = newImages ? [...existingImages, ...newImages] : existingImages;
    }
  } catch (error) {
    console.error("Error during image upload:", error);
    return res.status(500).json({
      success: false,
      message: `Error uploading new images: ${error.message}`,
    });
  }

  // Merge formatted data with the updated images and existing listing data if it exists
  let updateData = existingListing
    ? {
        ...existingListing.toObject(), // Spread the existing listing data to keep all current fields
        ...formattedData,              // Overwrite with new data from the request body (e.g., fields being updated)
        ...updatedImages,              // Include the updated images data
      }
    : {
        ...formattedData,
        ...updatedImages,
      };

  let latitude, longitude;

  // Fetch coordinates based on the address if provided
  if (
    formattedData.propertyLocation &&
    formattedData.propertyLocation.state &&
    formattedData.propertyLocation.city &&
    formattedData.propertyLocation.address
  ) {
    try {
      const { address, city, state } = formattedData.propertyLocation;
      const fullAddress = `${address}, ${city}, ${state}`;
      const coordinates = await getCoordinates(fullAddress);

      latitude = coordinates.latitude;
      longitude = coordinates.longitude;

      console.log(`Latitude: ${latitude} and Longitude: ${longitude} obtained`.cyan);
    } catch (error) {
      console.log(`Error getting coordinates: ${error}`.red);
      return res.status(500).json({
        success: false,
        message: `Error getting coordinates: ${error.message}`,
      });
    }
  }

  // Add location coordinates if available
  if (latitude && longitude) {
    updateData.propertyLocation = {
      ...updateData.propertyLocation,
      latitude,
      longitude,
    };
  }

  // Create a new listing or update the existing one
  try {
    if (existingListing) {
      console.log("Updating existing draft listing".green);
      existingListing = await DraftListing.findByIdAndUpdate(listingId, updateData, {
        new: true,
      });
    } else {
      console.log("Creating new draft listing".green);
      existingListing = await DraftListing.create({
        ...updateData,
        user: userId,
        propertyId: generateListingId(),
      });
    }

    // const finalUpdatedListing = await DraftListing.findById(listingId)

    console.log("Listing saved successfully as draft".magenta);
    res.status(200).json({
      success: true,
      message: "Listing saved successfully as draft",
      data: existingListing,
    });
  } catch (error) {
    console.error("Error saving listing:", error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error,
    });
  }
});

const getSingleListing = asyncHandler(async (req, res) => {
  console.log("Fetching a single listing".blue);

  const { id } = req.params;

  try {
      console.log(`Searching for listing with ID: ${id}`.yellow);

      const listing = await Listing.findById(id);

      if (!listing) {
          console.log(`Listing with ID: ${id} not found`.red);
          return res.status(404).json({
              success: false,
              message: "Listing not found",
          });
      }

      console.log("Listing found".green);
      
      res.status(200).json({
          success: true,
          message: "Listing retrieved successfully",
          data: listing,
      });
  } catch (error) {
      console.error('Error fetching listing:', error);
      res.status(500).json({
          success: false,
          message: `Server error: ${error.message}`,
          error,
      });
  }
});

const searchListings = asyncHandler(async (req, res) => {
  console.log("Searching for listings".blue);

  const { searchQuery, checkIn, checkOut, numberOfGuests } = req.body;
  const guests = numberOfGuests || { adult: 0, children: 0, pets: 0 };

  let filter = { status: "listed" };

  if (searchQuery) {
      filter.$or = [
          { "propertyLocation.state": { $regex: searchQuery, $options: 'i' } },
          { propertyName: { $regex: searchQuery, $options: 'i' } },
          { "propertyLocation.city": { $regex: searchQuery, $options: 'i' } },
          { propertyId: { $regex: searchQuery, $options: 'i' } },
      ];
  }

  let listings = await Listing.find(filter);

  listings = listings.filter(listing => {
      if (!checkIn || !checkOut) return true;

      const { calendar, maximumGuestNumber: listingGuests } = listing;
      const { unavailableDays } = calendar;

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      const checkInToCheckOutDates = [];
      for (let d = new Date(checkInDate); d <= checkOutDate; d.setDate(d.getDate() + 1)) {
          checkInToCheckOutDates.push(d.toISOString().split('T')[0]);
      }

      // Check for conflicts with unavailable days
      const conflictDates = checkInToCheckOutDates.filter(date => unavailableDays.includes(date));
      if (conflictDates.length > 0) {
          return false;
      }

      // Check guest limits
      if (numberOfGuests) {
          if (
              (guests.adult > listingGuests.adult) ||
              (guests.children > listingGuests.children) ||
              (guests.pets > listingGuests.pets)
          ) {
              return false;
          }
      }

      return true;
  });

  const searchIds = listings.map(listing => listing._id.toString());
  res.status(200).json({
      success: true,
      totalResults: listings.length,
      message: `Total of ${listings.length} listings found`,
      searchResultId: searchIds,
      data: listings,
  });
});

const filterListings = asyncHandler(async (req, res) => {
  console.log("Filtering listings based on user query...".blue);

  const {
    searchResultIds,
    propertyType,
    status,
    bedroomTotal,
    bathroomTotal,
    freeCancellation,
    minPrice,
    maxPrice,
    availableAmenities, 
    funPlacesNearby
  } = req.body;

  console.log("Search Result IDs:", searchResultIds);

  if (!searchResultIds || !Array.isArray(searchResultIds) || searchResultIds.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'No search result IDs provided or invalid format.'
    });
  }

  // Step 1: Retrieve initial set of listings based on searchResultIds
  let filter = { _id: { $in: searchResultIds } };
  let listings = await Listing.find(filter);

  // Step 2: Apply additional filters on the retrieved listings
  if (propertyType) {
    listings = listings.filter(listing => propertyType.includes(listing.propertyType));
  }

  if (status) {
    listings = listings.filter(listing => listing.status === status);
  }

  if (bedroomTotal) {
    listings = listings.filter(listing => listing.bedroomTotal === parseInt(bedroomTotal, 10));
  }

  if (bathroomTotal) {
    listings = listings.filter(listing => listing.bathroomTotal === parseInt(bathroomTotal, 10));
  }

  if (freeCancellation) {
    listings = listings.filter(listing => listing.freeCancellation === (freeCancellation === 'true'));
  }

  if (minPrice || maxPrice) {
    listings = listings.filter(listing => {
      const price = listing.chargePerNight;
      return (minPrice ? price >= parseFloat(minPrice) : true) &&
             (maxPrice ? price <= parseFloat(maxPrice) : true);
    });
  }

  if (availableAmenities && Array.isArray(availableAmenities) && availableAmenities.length) {
    listings = listings.filter(listing => 
      availableAmenities.every(amenity => listing.availableAmenities.allAmenities.includes(amenity?.toLowerCase()))
    );
  }

  if (funPlacesNearby) {
    listings = listings.filter(listing => {
      return funPlacesNearby.every(place => listing.funPlacesNearby.includes(place));
    });
  }

  console.log("Filtered Listings:", listings);

  res.status(200).json({
    status: 'success',
    message: `Found ${listings.length} listings matching your filters`,
    totalResults: listings.length,
    data: listings
  });
});

// @desc    Get user listings
// @route   GET /api/v1/listings
// @access  Public
const soGetAllListings = asyncHandler(async (req, res) => {
  
  try {
      console.log("Fetching user listings".blue);

      // Find listings based on the query object
      const listings = await Listing.find({user: req.user._id});
      const draftListings = await DraftListing.find({user: req.user._id})

      const allListings = [...listings, ...draftListings];

      console.log(`Total of ${allListings.length} listings fetched`.magenta);

      res.status(200).json({
          success: true,
          total: allListings.length,
          message: 'Listings retrieved successfully',
          data: allListings,
      });
  } catch (error) {
      console.error('Error fetching user listings:', error);
      res.status(500).json({
          success: false,
          message: `Server error: ${error.message}`,
          error,
      });
  }
});

const getListingByCategory = asyncHandler(async (req, res) => {
  console.log("Fetching listings by category".yellow);

  // Destructure categoryType correctly from the request body
  const { categoryType } = req.body;

  // Validate categoryType against allowedPropertyTypes
  if (!allowedPropertyTypes.includes(categoryType)) {
    console.log(`Invalid property type: ${categoryType}`.red);
    return res.status(400).json({
      success: false,
      message: `Invalid property type: ${categoryType}. Allowed types are: ${allowedPropertyTypes.join(', ')}`
    });
  }

  try {
    // Fetch listings based on propertyType
    const availableListings = await Listing.find({ propertyType: categoryType });
    if (!availableListings || availableListings.length < 1) {
      console.log("No listing found for the selected category".red);
      return res.status(200).json({
        success: true,
        message: "No listings found for the selected category at the moment, please do check back later"
      });
    }

    console.log(`Total of ${availableListings.length} listings found for ${categoryType} category`);
    return res.status(200).json({
      success: true,
      message: `Total of ${availableListings.length} listings found for ${categoryType} category`,
      data: availableListings
    });

  } catch (error) {
    console.error("Error getting listing by selected category:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting listing by selected category, try again later"
    });
  }
});


const getSingleUserListing = asyncHandler(async (req, res) => {
  console.log("Fetching a single user listing".blue);

  const { listingId } = req.query;

  try {
      console.log(`Searching for listing`.yellow);

      // Fetch the listing from the database using the provided ID
      const listing = await Listing.findById(listingId);

      if (!listing) {
          console.log(`Listing with ID: ${listingId} not found`.red);
          return res.status(404).json({
              success: false,
              message: "Listing not found",
          });
      }

      
      res.status(200).json({
          success: true,
          message: "Listing retrieved successfully",
          data: listing,
      });
  } catch (error) {
      console.error('Error fetching listing:', error);
      res.status(500).json({
          success: false,
          message: `Server error: ${error.message}`,
          error,
      });
  }
}); 

const editListing = asyncHandler(async (req, res) => {
  console.log("Editing listing".yellow);

  // Fetch the existing listing
  const listingId = req.params.id;
  const existingListing = await Listing.findById(listingId);

  if (!existingListing) {
      console.log("Listing not found".red);
      return res.status(404).json({
          success: false,
          message: "Listing not found"
      });
  }

  // Ensure at least one image is present in all the required sections
  const imageCategories = ['bedroomPictures', 'livingRoomPictures', 'bathroomToiletPictures', 'kitchenPictures', 'facilityPictures', 'otherPictures'];
  const missingCategories = imageCategories.filter(category => !existingListing[category] && !req.files[category]);
  if (missingCategories.length > 0) {
      console.log(`At least one image is required from all the image sections: ${missingCategories.join(', ')}`.red);

      return res.status(400).json({
          success: false,
          message: `At least one image is required from all the image sections: ${missingCategories.join(', ')}`
      });
  }

  let removedImages = req.body.removedImages;

  // Handle removed images
  if (removedImages) {
      console.log("Removing images", removedImages);
      if (typeof removedImages === 'string') {
          try {
              removedImages = JSON.parse(removedImages);
          } catch (error) {
              console.error('Error parsing removedImages:', error);
              removedImages = removedImages.split(',').map(image => image.trim());
          }
      }

      if (!Array.isArray(removedImages)) {
          console.log("Removed images should be an array".red);
          return res.status(400).json({
              success: false,
              message: "Removed images should be an array"
          });
      }

      try {
          console.log("Deleting images from Cloudinary".red);
          await deleteImagesFromCloudinary(removedImages);
      } catch (error) {
          console.error("Error during image deletion:", error);
          return res.status(500).json({
              success: false,
              message: `Error deleting images: ${error.message}`
          });
      }
  }

  // Format the listing data using the same logic as createListing
  const formattedData = formatListingData(req);

  let latitude, longitude;

  // Fetch coordinates based on the address
  try {
    const { address, city, state } = formattedData.propertyLocation;
    const fullAddress = `${address}, ${city}, ${state}`;
    const coordinates = await getCoordinates(fullAddress);

    latitude = coordinates.latitude;
    longitude = coordinates.longitude;

    console.log(`Latitude: ${latitude} and Longitude: ${longitude} obtained`.cyan);
  } catch (error) {
      console.log(`Error getting coordinates: ${error}`.red);
      return res.status(500).json({ success: false, message: `Error getting coordinates: ${error.message}` });
  }

  let updatedImages = {};
  try {
      console.log("Uploading new images and merging with existing images".blue);

      for (let category of imageCategories) {
          const newImages = req.files[category] ? await uploadListingImagesToCloudinary(req.files[category]) : [];

          const existingImages = existingListing[category].filter(image => !removedImages.includes(image.public_id));

          updatedImages[category] = [...existingImages, ...newImages];
      }
  } catch (error) {
      console.error("Error during image upload:", error);
      return res.status(500).json({
          success: false,
          message: `Error uploading new images: ${error.message}`
      });
  }

  // Update the listing with the new data and images
  try {
      console.log("Updating listing".green);
      const updatedListing = await Listing.findByIdAndUpdate(
          listingId,
          {
              ...formattedData,
              propertyLocation: {
                ...formattedData.propertyLocation,
                latitude,
                longitude
            },
              ...updatedImages // Add the merged image arrays
          },
          { new: true }
      );

      const finalListing  = await Listing.findById(listingId)

      if(!finalListing) {
        console.log("Listing not found".red)
        return res.status(404).json({
          success: false,
          message: "Listing cannot be found again after updating"
        })
      }

      console.log("Listing updated successfully".magenta);
      res.status(200).json({
          success: true,
          message: "Listing updated successfully",
          data: finalListing
      });
  } catch (error) {
      console.error("Error updating listing:", error);
      return res.status(500).json({
          success: false,
          message: `Server error: ${error.message}`,
          error
      });
  }
});

const deleteListing = asyncHandler(async (req, res) => {
  console.log("Deleting listing...".yellow);

  const { listingId } = req.body;
  const userId = req.user._id.toString();

  if (!listingId) {
    console.log("Valid listing Id is required".red);
    return res.status(400).json({
      success: false,
      message: "Valid listing Id is required"
    });
  } 

  try {
    // I first try finding the listing in the Listing model
    let existingListing = await Listing.findById(listingId);

    // If not found, I try finding it in the DraftListing model
    let isDraft = false;
    if (!existingListing) {
      existingListing = await DraftListing.findById(listingId);
      isDraft = !!existingListing; // I then set isDraft to true if found in DraftListing
    }

    if (!existingListing) {
      console.log("Listing selected to be deleted does not exist".red);
      return res.status(404).json({
        success: false,
        message: "Listing selected to be deleted does not exist"
      });
    }

    if (existingListing.user.toString() !== userId) {
      console.log("Unauthorized attempt to delete listing".red);
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this listing"
      });
    }

    // If it is a listing (not a draft), check if there are upcoming bookings
    if (!isDraft) {
      const bookings = await Booking.find({ listing: listingId });
      const currentDate = new Date();
      for (const booking of bookings) {
        const hasUpcomingBooking = booking.bookedDays.some(
          (day) => new Date(day) > currentDate
        );

        if (hasUpcomingBooking) {
          console.log("Cannot delete listing, there are upcoming bookings".red);
          return res.status(400).json({
            success: false,
            message: "Cannot delete listing as there are upcoming bookings."
          });
        }
      }
    }

    const imageCategories = [
      "bedroomPictures",
      "livingRoomPictures",
      "bathroomToiletPictures",
      "kitchenPictures",
      "facilityPictures",
      "otherPictures",
    ];

    const publicIds = [];
    imageCategories.forEach((category) => {
      if (existingListing[category] && Array.isArray(existingListing[category])) {
        existingListing[category].forEach((image) => {
          if (image.public_id) {
            publicIds.push(image.public_id);
          }
        });
      }
    });

    // Delete images from Cloudinary
    if (publicIds.length > 0) {
      await deleteImagesFromCloudinary(publicIds);
    }

    // Delete the listing or draft listing
    if (isDraft) {
      await DraftListing.findByIdAndDelete(listingId);
      console.log("Draft listing successfully deleted".america);
    } else {
      await Listing.findByIdAndDelete(listingId);
      console.log("Listing successfully deleted".america);
    }

    return res.status(200).json({
      success: true,
      message: "Listing successfully deleted"
    });
  } catch (error) {
    console.error("Error deleting listing", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting listing"
    });
  }
});


export { 
createListing,
searchListings,
filterListings,
soGetAllListings,
getListingByCategory,
getSingleListing,
getSingleUserListing,
editListing,
saveListingForLater,
deleteListing
};
