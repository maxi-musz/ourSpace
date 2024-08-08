import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js";

// @access  Private
const createListing = asyncHandler(async (req, res) => {

    console.log("Create new lisitng endpoint".blue)

    try {
        const {
            propertyName, propertyType, price, bedroomTotal,freeCancellation, funPlacesNearby, livingRoomTotal,bedTotal,bathroomTotal,toiletTotal,maximumGuestNumber,propertyLocation,description,bedroomPictures,livingRoomPictures,bathroomToiletPictures,kitchenPictures,facilityPictures,otherPictures,availableAmenities,arrivalDepartureDetails,minimumDays,infoForGuests,guestMeansOfId,chargeType,chargeCurrency,acceptOtherCurrency,pricePerGuest,discount,cancellationOption
        } = req.body;

    // Create a new listing
    const listing = new Listing({
        user: req.user._id,
        propertyName,
        price,
        propertyType,
        bedroomTotal,
        freeCancellation,
        funPlacesNearby,
        livingRoomTotal,
        bedTotal,
        bathroomTotal,
        toiletTotal,
        maximumGuestNumber,
        propertyLocation,
        description,
        bedroomPictures,
        livingRoomPictures,
        bathroomToiletPictures,
        kitchenPictures,
        facilityPictures,
        otherPictures,
        availableAmenities,
        arrivalDepartureDetails,
        minimumDays,
        infoForGuests,
        guestMeansOfId,
        chargeType,
        chargeCurrency,
        acceptOtherCurrency,
        pricePerGuest,
        discount,
        cancellationOption
    });

    const createdListing = await listing.save();
    console.log("new listing successfully created")
    res.status(201).json({
        success: true,
        message: "New listing successfully created",
        data: createdListing
    });

    } catch (error) {
        console.log("Error:", error.message)
        return res.status().json({
            success: false,
            message: error.message
        })
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
    filterListings,
    getAllListings
   };