import opencage from 'opencage-api-client';
import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js";
import cloudinaryConfig from "../../uploadUtils/cloudinaryConfig.js";
import formatListingData from "../../utils/formatListingData.js"

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

const uploadListingImagesToCloudinary = async (files) => {
  return Promise.all(files.map(async (file) => {
    const result = await cloudinaryConfig.uploader.upload(file.path, {
      folder: 'ourSpace/listing-images',
    });
    return result.secure_url; 
  }));
};

const createListing = asyncHandler(async (req, res) => {
    console.log("Creating a new listing".blue)

    const userId = req.user._id.toString();

    try {
        console.log('Formatting listings');
        
        // Extract and format fields from request body using the utility function
        const formattedData = formatListingData(req);

        console.log('Formatted data:', formattedData);

        // Get latitude and longitude for the address
        const { address, city, state } = formattedData.propertyLocation;
        const fullAddress = `${address}, ${city}, ${state}`;
        const { latitude, longitude } = await getCoordinates(fullAddress);

        console.log(`Latitdue: ${latitude} \nLongitude: ${longitude}`.yellow)

        // Initialize arrays to store the URLs after uploading
        let bedroomPictures = [];
        let livingRoomPictures = [];
        let bathroomToiletPictures = [];
        let kitchenPictures = [];
        let facilityPictures = [];
        let otherPictures = [];

        // Upload the images to Cloudinary
        if (req.files.bedroomPictures) {
            console.log("Uploading bedroom pictures".grey)
            bedroomPictures = await uploadListingImagesToCloudinary(req.files.bedroomPictures);
        }
        if (req.files.livingRoomPictures) {
            console.log("Uploading livingroom pictures".yellow)
            livingRoomPictures = await uploadListingImagesToCloudinary(req.files.livingRoomPictures);
        }
        if (req.files.bathroomToiletPictures) {
            console.log("Uploading bathroom toilet pictures".blue)
            bathroomToiletPictures = await uploadListingImagesToCloudinary(req.files.bathroomToiletPictures);
        }
        if (req.files.kitchenPictures) {
            console.log("Uploading kitchen pictures".green)
            kitchenPictures = await uploadListingImagesToCloudinary(req.files.kitchenPictures);
        }
        if (req.files.facilityPictures) {
            console.log("Uploading facility pictures".white)
            facilityPictures = await uploadListingImagesToCloudinary(req.files.facilityPictures);
        }
        if (req.files.otherPictures) {
            console.log("Uploading other pictures".grey)
            otherPictures = await uploadListingImagesToCloudinary(req.files.otherPictures);
        }
        console.log("Pictures uploaded");

        // Proceed with saving the formattedData to the database
        const newListing = await Listing.create({
            ...formattedData,
            user: userId,
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

// @desc    Get all listings
// @route   GET /api/v1/listings
// @access  Public
const getAllListings = asyncHandler(async (req, res) => {
    console.log("Fetching all listings".grey);

    const listings = await Listing.find({});

    if (listings.length === 0) {
        console.log("No listings found".yellow);
        return res.status(404).json({
            status: 'fail',
            message: 'No listings found',
        });
    }

    console.log(`${listings.length} listings found`.green);
    res.status(200).json({
        status: 'success',
        totalListings: listings.length,
        data: listings,
    });
});

const searchListings = asyncHandler(async (req, res) => {
  console.log("Searching for listings".blue);

  const { searchQuery, checkIn, checkOut, numberOfGuests } = req.body;
  console.log(`Search Query: ${searchQuery}, Number of Guests: ${JSON.stringify(numberOfGuests)}`);

  const guests = numberOfGuests || { adult: 0, children: 0, pets: 0 };

  let filter = {};

  // Filter by searchQuery which can be either state, propertyName, or city
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
    searchResultIds, // List of IDs returned from the search
    propertyType,
    status,
    bedroomTotal,
    bathroomTotal,
    freeCancellation,
    minPrice,
    maxPrice,
    propertyAmenities,
    roomFeatures,
    outdoorActivities,
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

  if (propertyAmenities || Array.isArray(req.body.propertyAmenities) && req.body.propertyAmenities.length) {
    filter['availableAmenities.propertyAmenities'] = { $all: req.body.propertyAmenities.map(item => item.toLowerCase()) };
  }
  
  if (roomFeatures || Array.isArray(req.body.roomFeatures) && req.body.roomFeatures.length) {
    filter['availableAmenities.roomFeatures'] = { $all: req.body.roomFeatures.map(item => item.toLowerCase()) };
  }
  
  if (outdoorActivities || Array.isArray(req.body.outdoorActivities) && req.body.outdoorActivities.length) {
    filter['availableAmenities.outdoorActivities'] = { $all: req.body.outdoorActivities.map(item => item.toLowerCase()) };
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





  
export { 
createListing,
searchListings,
filterListings,
getAllListings
};