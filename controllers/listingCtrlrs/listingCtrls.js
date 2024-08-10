import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js";
import cloudinaryConfig from "../../uploadUtils/cloudinaryConfig.js";
import { formatListingData } from "../../utils/formatListingData.js";


const uploadImagesToCloudinary = async (files) => {
    return Promise.all(files.map(async (file) => {
      const result = await cloudinaryConfig.uploader.upload(file.path, {
        folder: 'listings',
      });
      return result.secure_url; 
    }));
};

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

  const { city, propertyName, propertyId, checkIn, checkOut, numberOfGuests } = req.body;
  console.log(`Search Parameters: City - ${city}, CheckIn - ${JSON.stringify(checkIn)}, CheckOut - ${JSON.stringify(checkOut)}, Guests - ${JSON.stringify(numberOfGuests)}`);

  let filter = {};

  // Filter by City, PropertyName, or PropertyId
  if (city) {
    filter.city = { $regex: city, $options: 'i' };
  }
  if (propertyName) {
      filter.propertyName = { $regex: propertyName, $options: 'i' };
  }
  if (propertyId) {
      filter._id = propertyId; // Assuming propertyId is the unique identifier (_id) in your database
  }

  // Fetch listings based on city
  let listings = await Listing.find(filter);

  // Filter listings by availability and guest requirements
  listings = listings.filter(listing => {
      if (!checkIn || !checkOut) return true; // If no checkIn/checkOut dates are provided, consider all listings

      const { bookedDays, numberOfGuests: listingGuests } = listing;

      // Convert bookedDays to a set of strings for easy lookup
      const bookedDaysSet = new Set(bookedDays.map(day => `${day.date}-${day.month}-${day.year}`));

      // Check if any of the dates in the requested range are already booked
      for (let date = checkIn.date; date <= checkOut.date; date++) {
          const checkDate = `${date}-${checkIn.month}-${checkIn.year}`;
          if (bookedDaysSet.has(checkDate)) {
              return false; // Date is already booked
          }
      }
      
      // Check if the listing can accommodate the required number of guests
      if (numberOfGuests) {
          if (
              (numberOfGuests.adult > listingGuests.adult) || 
              (numberOfGuests.children > listingGuests.children) || 
              (numberOfGuests.pets > listingGuests.pets)
          ) {
              return false; // Listing can't accommodate the requested number of guests
          }
      }

      return true; // No conflicts, the listing is available
  });

  // Log the total number of listings found
  console.log(`Total of ${listings.length} listings found`.magenta);
  
  // Return the filtered listings
  res.status(200).json({
      success: true,
      totalResults: listings.length,
      message: `Total of ${listings.length} listings found`,
      data: listings
  });
});

const createListing = asyncHandler(async (req, res) => {
  console.log("Creating a new listing".blue)

  const userId = req.user._id.toString();

  try {
    console.log('Formatting listings');

    // Extract and format fields from request body
    const formattedData = {
      user: req.body.user,
      propertyName: req.body.propertyName,
      city: req.body.city,
      propertyType: req.body.propertyType,
      status: req.body.status,
      bedroomTotal: parseInt(req.body.bedroomTotal, 10),
      livingRoomTotal: parseInt(req.body.livingRoomTotal, 10),
      bedTotal: parseInt(req.body.bedTotal, 10),
      bathroomTotal: parseInt(req.body.bathroomTotal, 10),
      freeCancellation: req.body.freeCancellation === 'true',
      toiletTotal: parseInt(req.body.toiletTotal, 10),
      maximumGuestNumber: {
        adult: parseInt(req.body['maximumGuestNumber.adult'], 10),
        children: parseInt(req.body['maximumGuestNumber.children'], 10),
        pets: parseInt(req.body['maximumGuestNumber.pets'], 10)
      },

      propertyLocation: {
        address: req.body['propertyLocation.address'],
        apartmentNumber: parseInt(req.body['propertyLocation.apartmentNumber'], 10),
        apartmentSize: parseInt(req.body['propertyLocation.apartmentSize'], 10)
      },
      description: req.body.description,
      availableAmenities: Array.isArray(req.body.availableAmenities) ? req.body.availableAmenities : req.body.availableAmenities ? req.body.availableAmenities.split(',') : [],
      funPlacesNearby: Array.isArray(req.body.funPlacesNearby) ? req.body.funPlacesNearby : req.body.funPlacesNearby ? req.body.funPlacesNearby.split(',') : [],
      arrivalDepartureDetails: {
        checkIn: {
          date: parseInt(req.body['arrivalDepartureDetails.checkIn.date'], 10),
          month: parseInt(req.body['arrivalDepartureDetails.checkIn.month'], 10),
          year: parseInt(req.body['arrivalDepartureDetails.checkIn.year'], 10)
        },
        checkOut: {
          date: parseInt(req.body['arrivalDepartureDetails.checkOut.date'], 10),
          month: parseInt(req.body['arrivalDepartureDetails.checkOut.month'], 10),
          year: parseInt(req.body['arrivalDepartureDetails.checkOut.year'], 10)
        }
      },
      minimumDays: parseInt(req.body.minimumDays, 10),
      infoForGuests: {
        petsAllowed: req.body.infoForGuests?.petsAllowed === 'true' || false,
        kidsAllowed: req.body.infoForGuests?.kidsAllowed === 'true' || false,
        partiesAllowed: req.body.infoForGuests?.partiesAllowed === 'true' || false,
        smokingAllowed: req.body.infoForGuests?.smokingAllowed === 'true' || false,
        cctvAvailable: req.body.infoForGuests?.cctvAvailable === 'true' || false
      },
      guestMeansOfId: req.body.guestMeansOfId,
      chargeType: req.body.chargeType,
      chargeCurrency: req.body.chargeCurrency,
      acceptOtherCurrency: req.body.acceptOtherCurrency === 'true',
      pricePerGuest: parseFloat(req.body.pricePerGuest),
      price: parseFloat(req.body.price),
      discount: req.body.discount === 'true',
      cancellationOption: req.body.cancellationOption
    };

    console.log('Formatted data:', formattedData);

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
      bedroomPictures = await uploadImagesToCloudinary(req.files.bedroomPictures);
    }
    if (req.files.livingRoomPictures) {
      console.log("Uploading livingroom pictures".yellow)
      livingRoomPictures = await uploadImagesToCloudinary(req.files.livingRoomPictures);
    }
    if (req.files.bathroomToiletPictures) {
      console.log("Uploading bathroom toilet pictures".blue)
      bathroomToiletPictures = await uploadImagesToCloudinary(req.files.bathroomToiletPictures);
    }
    if (req.files.kitchenPictures) {
      console.log("Uploading kitchen pictures".green)
      kitchenPictures = await uploadImagesToCloudinary(req.files.kitchenPictures);
    }
    if (req.files.facilityPictures) {
      console.log("Uploading facility pictures".white)
      facilityPictures = await uploadImagesToCloudinary(req.files.facilityPictures);
    }
    if (req.files.otherPictures) {
      console.log("Uploading other pictures".grey)
      otherPictures = await uploadImagesToCloudinary(req.files.otherPictures);
    }
    console.log("Pictures uploaded");

    // Proceed with saving the formattedData to the database
    const newListing = await Listing.create({
      ...formattedData,
      user: userId,
      bedroomPictures,
      livingRoomPictures,
      bathroomToiletPictures,
      kitchenPictures,
      facilityPictures,
      otherPictures
    });

    res.status(201).json({
      success: true,
      data: newListing
    });
  } catch (error) {
    console.error('Error creating property listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


const filterListings = asyncHandler(async (req, res) => {
    console.log("Filtering listings based on user query...".blue);

    const {
        propertyType,
        status,
        bedroomTotal,
        bathroomTotal,
        freeCancellation,
        minPrice,
        maxPrice,
        amenities,
        funPlacesNearby
    } = req.query;

    console.log("Request", amenities)

    // Create a filter object based on the query parameters
    let filter = {};

    if (propertyType) {
        filter.propertyType = { $in: propertyType.split(',') };
    }

    if (status) {
        filter.status = status;
    }

    if (bedroomTotal) {
        filter.bedroomTotal = parseInt(bedroomTotal, 10);
    }

    if (bathroomTotal) {
        filter.bathroomTotal = parseInt(bathroomTotal, 10);
    }

    if (freeCancellation) {
        filter.freeCancellation = freeCancellation === 'true';
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) {
            filter.price.$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
            filter.price.$lte = parseFloat(maxPrice);
        }
    }

    if (amenities) {
        console.log("Available amenities present".yellow)
        filter.availableAmenities = { $all: amenities.split(',') };
    }

    if (funPlacesNearby) {
        filter.funPlacesNearby = { $all: funPlacesNearby.split(',') };
    }

    console.log("Filter object:", filter);

    // Fetch the filtered listings from the database
    const listings = await Listing.find(filter);
    const totalListings = listings.length
    console.log(`Total listings found: ${totalListings}`);

    res.status(200).json({
        status: 'success',
        message: `Found ${totalListings} listings matching your filters`,
        totalResults: listings.length,
        listings
    });
});
  
export { 
createListing,
searchListings,
filterListings,
getAllListings
};