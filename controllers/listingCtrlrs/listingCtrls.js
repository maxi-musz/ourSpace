// @desc    Create a new listing
// @route   POST /api/listings

import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js";

// @access  Private
const createListing = asyncHandler(async (req, res) => {

    console.log("Create new lisitng endpoint".blue)

    try {
        const {
            propertyName,
            propertyType,
            bedroomTotal,
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
        } = req.body;

    // Create a new listing
    const listing = new Listing({
        user: req.user._id,
        propertyName,
        propertyType,
        bedroomTotal,
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
  
  export { createListing };