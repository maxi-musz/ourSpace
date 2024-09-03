import opencage from 'opencage-api-client';
import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js";
import cloudinaryConfig from "../../uploadUtils/cloudinaryConfig.js";
import formatListingData from "../../utils/formatListingData.js"
import Booking from '../../models/bookingsModel.js';

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

const createListing = asyncHandler(async (req, res) => {

    const userId = req.user._id.toString();

    try {
        console.log('Formatting listings');

        // Extract and format fields from request body using the utility function
        const formattedData = formatListingData(req);

        // Get latitude and longitude for the address
        const { address, city, state } = formattedData.propertyLocation;
        const fullAddress = `${address}, ${city}, ${state}`;
        const { latitude, longitude } = await getCoordinates(fullAddress);

        console.log(`Latitdue: ${latitude} \nLongitude: ${longitude}`.yellow)

        let bedroomPictures = [];
        let livingRoomPictures = [];
        let bathroomToiletPictures = [];
        let kitchenPictures = [];
        let facilityPictures = [];
        let otherPictures = [];

        if (req.files.bedroomPictures) {
            console.log("Uploading bedroom pictures".grey)
            bedroomPictures = await uploadListingImagesToCloudinary(req.files.bedroomPictures)
            console.log("Bedroom pictures uploaded".blue)
            ;
        }
        if (req.files.livingRoomPictures) {
            console.log("Uploading livingroom pictures".grey)
            livingRoomPictures = await uploadListingImagesToCloudinary(req.files.livingRoomPictures)
            console.log("living room pictures uploaded".blue)
            ;
        }
        if (req.files.bathroomToiletPictures) {
            console.log("Uploading bathroom toilet pictures".grey)
            bathroomToiletPictures = await uploadListingImagesToCloudinary(req.files.bathroomToiletPictures)
            console.log("Bathroom pictures uploaded".blue);
        }
        if (req.files.kitchenPictures) {
            console.log("Uploading kitchen pictures".grey)
            kitchenPictures = await uploadListingImagesToCloudinary(req.files.kitchenPictures)
            console.log("Kitchen pictures uploaded".blue)
        }
        if (req.files.facilityPictures) {
            console.log("Uploading facility pictures".grey)
            facilityPictures = await uploadListingImagesToCloudinary(req.files.facilityPictures)
            console.log("Bedroom pictures uploaded".blue)
        }
        if (req.files.otherPictures) {
            console.log("Uploading other pictures".grey)
            otherPictures = await uploadListingImagesToCloudinary(req.files.otherPictures)
            console.log("Other pictures uploaded".blue)
        }
        console.log("Pictures uploaded".yellow);

        // Proceed with saving the formattedData to the database
        const newListing = await Listing.create({
            ...formattedData,
            user: userId,
            listingStatus: req.body.listingStatus === 'draft' ? 'draft' : 'pending',
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
        console.error('Error creating property listing:', error);
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
  const userId = req.user._id.toString();

  try {
      console.log(`Searching for listing with ID: ${listingId}`.yellow);

      // Fetch the listing from the database using the provided ID
      const listing = await Listing.findById(listingId);

      if (!listing) {
          console.log(`Listing with ID: ${listingId} not found`.red);
          return res.status(404).json({
              success: false,
              message: "Listing not found",
          });
      }

      // Check if the requesting user is the owner of the listing
      if (listing.user.toString() !== userId) {
          console.log(`User ${userId} is not authorized to access listing ${listingId}`.red);
          return res.status(403).json({
              success: false,
              message: "You are not authorized to access this listing",
          });
      }

      console.log(`User ${userId} is authorized. Listing found`.green);
      
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
      console.log(`check in date: ${checkInDate}\nCheckout date: ${checkOutDate}`)

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