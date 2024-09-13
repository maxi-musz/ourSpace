import opencage from 'opencage-api-client';
import asyncHandler from "../middleware/asyncHandler.js";
import Listing from "../models/listingModel.js";
import cloudinaryConfig from "../uploadUtils/cloudinaryConfig.js";
import formatListingData from "../utils/formatListingData.js"
import Booking from '../models/bookingModel.js';

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

const rollbackUploadedImages = async (publicIds) => {
  for (const publicId of publicIds) {
      try {
          const result = await cloudinaryConfig.uploader.destroy(publicId);
          console.log(`Deleted image: ${publicId}`, result);
      } catch (error) {
          console.error(`Failed to delete image: ${publicId}`, error.message);
      }
  }
};

//
const createListing = asyncHandler(async (req, res) => {
    console.log("Creating a new listing".blue)
    const userId = req.user._id.toString();

    let bedroomPictures = [];
    let livingRoomPictures = [];
    let bathroomToiletPictures = [];
    let kitchenPictures = [];
    let facilityPictures = [];
    let otherPictures = [];

    try {
        if(!req.files.bedroomPictures || !req.files.livingRoomPictures ||!req.files.bathroomToiletPictures ||!req.files.kitchenPictures ||!req.files.facilityPictures || !req.files.otherPictures) {
          console.log("One image at least is required from all the image sections".red)

          return res.status(400).json({
            success: false,
            message: "One image at least is required from all the image sections"
          })
        }

        console.log('Formatting listings');

        const formattedData = formatListingData(req);

        let latitude, longitude;

        try {
            const { address, city, state } = formattedData.propertyLocation;
            const fullAddress = `${address}, ${city}, ${state}`;
            const coordinates = await getCoordinates(fullAddress);  // Changed here

            // Assign latitude and longitude
            latitude = coordinates.latitude;
            longitude = coordinates.longitude;

            console.log(`Latitude: ${latitude} and Longitude: ${longitude} obtained`.cyan);
        } catch (error) {
            console.log(`Error getting coordinates: ${error}`.red);
            return res.status(500).json({ success: false, message: `Error getting coordinates: ${error.message}` });
        }

        console.log(`Latitdue: ${latitude} \nLongitude: ${longitude}`.yellow)

        try {
          console.log("Uploading pictures".cyan)
          bedroomPictures = await uploadListingImagesToCloudinary(req.files.bedroomPictures)
          livingRoomPictures = await uploadListingImagesToCloudinary(req.files.livingRoomPictures)
          bathroomToiletPictures = await uploadListingImagesToCloudinary(req.files.bathroomToiletPictures)
          kitchenPictures = await uploadListingImagesToCloudinary(req.files.kitchenPictures)
          facilityPictures = await uploadListingImagesToCloudinary(req.files.facilityPictures)
          otherPictures = await uploadListingImagesToCloudinary(req.files.otherPictures)
        } catch (error) {
          console.error('Error uploading images:', error.stack || JSON.stringify(error, null, 2));
          return res.status(500).json({ success: false, message: `Error uploading listing images: ${error.message || error}` });
        }

        console.log("Pictures uploaded".yellow);

        const validStatuses = ['approved', 'rejected', 'active', 'inactive', 'pending', 'draft',"saved", 'archived', 'blocked'];
        const listingStatus = validStatuses.includes(req.body.listingStatus) ? req.body.listingStatus : 'pending';

        function generateListingId() {
          const randomDigits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
          return `OS${randomDigits}`;
        }

        const newListing = await Listing.create({
            ...formattedData,
            user: userId,
            propertyId: generateListingId(),
            listingStatus: listingStatus,
            propertyLocation: {
              ...formattedData.propertyLocation,
              latitude,
              longitude
            },
            bedroomPictures,
            livingRoomPictures,
            bathroomToiletPictures,
            kitchenPictures,
            facilityPictures,
            otherPictures
        });

        console.log("New Listing successfully created".magenta)
        res.status(201).json({
            success: true,
            message: "You've successfully created a new listing",
            data: newListing
        });
    } catch (error) {
        console.error('Error creating property listing:', error.stack || error);

        const allPublicIds = [
          ...bedroomPictures.map(image => image.public_id),
          ...livingRoomPictures.map(image => image.public_id),
          ...bathroomToiletPictures.map(image => image.public_id),
          ...kitchenPictures.map(image => image.public_id),
          ...facilityPictures.map(image => image.public_id),
          ...otherPictures.map(image => image.public_id)
      ];

      // Try to delete the images in case of error
      try {
          await deleteImagesFromCloudinary(allPublicIds);
      } catch (deleteError) {
          console.error("Error during image deletion:", deleteError);
      }

        res.status(500).json({
            success: false,
            message: `Server error: ${error.message}`,
            error
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
  console.log(`Search Query: ${searchQuery}, Number of Guests: ${JSON.stringify(numberOfGuests)}`);

  const guests = numberOfGuests || { adult: 0, children: 0, pets: 0 };

  let filter = {
    status: "listed" // Only include listings with a status of "listed"
  };

  // Filter by searchQuery which can be either state, propertyName, city, or propertyId
  if (searchQuery) {
      filter.$or = [
          { "propertyLocation.state": { $regex: searchQuery, $options: 'i' } },
          { propertyName: { $regex: searchQuery, $options: 'i' } },
          { "propertyLocation.city": { $regex: searchQuery, $options: 'i' } },
          { propertyId: { $regex: searchQuery, $options: 'i' } },
      ];
  }

  // Fetch listings based on the filter
  let listings = await Listing.find(filter);

  listings = listings.filter(listing => {
      if (!checkIn || !checkOut) return true;

      const { bookedDays, maximumGuestNumber: listingGuests } = listing;

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const bookedDaysSet = new Set(bookedDays.map(day => new Date(day).toISOString().split('T')[0]));

      for (let date = checkInDate; date <= checkOutDate; date.setDate(date.getDate() + 1)) {
          if (bookedDaysSet.has(date.toISOString().split('T')[0])) {
              return false;
          }
      }

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
  console.log(`Total of ${listings.length} listings found`.magenta);

  res.status(200).json({
      success: true,
      totalResults: listings.length,
      message: `Total of ${listings.length} listings found`,
      searchResultId: searchIds,
      data: listings
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
const getUserApprovedListings = asyncHandler(async (req, res) => {
  
  try {
      console.log("Fetching user listings".blue);

      // Find listings based on the query object
      const listings = await Listing.find({user: req.user._id});

      console.log(`Total of ${listings.length} listings fetched`.magenta);

      res.status(200).json({
          success: true,
          total: listings.length,
          message: 'Listings retrieved successfully',
          data: listings,
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

  let removedImages = req.body.removedImages;

  console.log("Removing images", removedImages);

  if (typeof removedImages === 'string') {
    try {
      removedImages = JSON.parse(removedImages);
    } catch (error) {
      console.error('Error parsing removedImages:', error);
      removedImages = removedImages.split(',').map(image => image.trim());
    }
  }

  // Ensure removedImages is an array
  if (!Array.isArray(removedImages)) {
    console.log("Removed images should be an array".red)
    return res.status(400).json({
      success: false,
      message: "Removed images should be an array"
    });
  }

  try {
    console.log("Deleting images from Cloudinary".red);
    await deleteImagesFromCloudinary(removedImages);

    // Upload new images
    console.log("Uploading new images".blue);
    const newImages = {
      bedroomPictures: await uploadListingImagesToCloudinary(req.files.bedroomPictures || []),
      livingRoomPictures: await uploadListingImagesToCloudinary(req.files.livingRoomPictures || []),
      bathroomToiletPictures: await uploadListingImagesToCloudinary(req.files.bathroomToiletPictures || []),
      kitchenPictures: await uploadListingImagesToCloudinary(req.files.kitchenPictures || []),
      facilityPictures: await uploadListingImagesToCloudinary(req.files.facilityPictures || []),
      otherPictures: await uploadListingImagesToCloudinary(req.files.otherPictures || [])
    };

    // Update the listing
    console.log("Updating listing".green);
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      {
        ...req.body,
        ...newImages
      },
      { new: true }
    );

    console.log("Listing updated successfully:".magenta);

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: updatedListing
    });
  } catch (error) {
    console.error('Error during image deletion or update:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error
    });
  }
});


const getBookingHistory = asyncHandler(async (req, res) => {
  const { listingId } = req.query;

  try {
      console.log(`Fetching booking history for listing ID: ${listingId}`.blue);

      const bookings = await Booking.find({ listing: listingId })
          .populate('user', 'name')
          .sort({ date: -1 });

      console.log(`Booking history retrieved for listing ID: ${listingId}`.green);

      const formattedBookings = bookings.map(booking => ({
          date: booking.date,
          description: booking.description,
          guestName: booking.user.name,
          nightsSpent: booking.nightsSpent,
          amountPaid: booking.amountPaid,
      }));

      res.status(200).json({
          success: true,
          message: "Booking history retrieved successfully",
          total: formattedBookings.length,
          data: formattedBookings,
      });
  } catch (error) {
      console.error('Error fetching booking history:', error);
      res.status(500).json({
          success: false,
          message: `Server error: ${error.message}`,
          error,
      });
  }
});

const checkAvailability = asyncHandler(async (req, res) => {
  console.log("Checking availability before booking endpoint...".yellow);

  const { listingId } = req.params;
  const { checkIn, checkOut, spaceUsers } = req.body;

  console.log(listingId)
  console.log(`check in: ${checkIn}\nCheckout: ${checkOut}`)

  try {
      const listing = await Listing.findById(listingId);

      if (!listing) {
          console.log("Listing not found".red);
          return res.status(404).json({ success: false, message: "Listing not found" });
      }

      const { availability, bookedDays, maximumGuestNumber } = listing;
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const checkInToCheckOutDates = [];
      for (let d = new Date(checkInDate); d <= checkOutDate; d.setDate(d.getDate() + 1)) {
          checkInToCheckOutDates.push(d.toISOString().split('T')[0]);
      }

      if (availability.length > 0) {
          const unavailableDates = checkInToCheckOutDates.filter(date => !availability.includes(date));
          if (unavailableDates.length > 0) {
              console.log(`Listing is not available for dates: ${unavailableDates.join(", ")}`.red);
              return res.status(400).json({
                  success: false,
                  message: `Listing is not available for the following dates: ${unavailableDates.join(", ")}`,
              });
          }
      }

      const conflictDates = checkInToCheckOutDates.filter(date => bookedDays.includes(date));
      if (conflictDates.length > 0) {
          console.log(`Listing is booked on the following dates: ${conflictDates.join(", ")}`.red);
          return res.status(400).json({
              success: false,
              message: `Listing is booked on the following dates: ${conflictDates.join(", ")}`,
              bookedDates: conflictDates,
          });
      }

      if (spaceUsers > maximumGuestNumber) {
          console.log(`Number of guests (${spaceUsers}) exceeds the maximum allowed (${maximumGuestNumber})`.red);
          return res.status(400).json({
              success: false,
              message: `The number of guests exceeds the maximum allowed. Maximum allowed is ${maximumGuestNumber}.`,
          });
      }

      console.log("Listing is available for booking".green);
      res.status(200).json({
          success: true,
          message: "Listing is available for booking",
          availableDates: checkInToCheckOutDates,
      });

  } catch (error) {
      console.log(`Error checking availability: ${error.message}`.red);
      res.status(500).json({
          success: false,
          message: "An error occurred while checking availability",
      });
  }
});


export { 
createListing,
searchListings,
filterListings,
getUserApprovedListings,
getSingleListing,
getSingleUserListing,
editListing,
getBookingHistory,
checkAvailability
};