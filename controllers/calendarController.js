import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Listing from "../models/listingModel.js";
import { formatDate, formatDateWithoutTime } from "../utils/helperFunction.js";

export const getCalendar = asyncHandler(async(req, res) => {
    console.log("Getting space owner listing calendar".yellow)

    try {
        const listing = await Listing.find({
            user: req.user._id,
            status: "listed"
        })

        if(!listing) {
            console.log("You currently have no listing at the moment".red)
            return res.status(200).json({
                success: true,
                message: "You currently have no listing at the moment",
                totalListing: listing.length,
                data: listing
            })
        }

        const formattedListings = listing.map((listing) => ({
            id: listing._id,
            listingImage: listing.bedroomPictures[0].secure_url,
            propertyName: listing.propertyName,
            roomNumber: listing.propertyLocation.apartmentNumber,
            listingId: listing.propertyId,
            location: `${listing.propertyLocation.address}, ${listing.propertyLocation.state}, Nigeria`,
            bookedDays: listing.calendar.bookedDays,
            blockedDays: listing.calendar.blockedDays,
            availableDays: listing.calendar.availableDays

        }))

        console.log(`Total of ${listing.length} listings found`.magenta)
        return res.status(200).json({
            success: true,
            message: "Calendar dashboard successfully retrieved",
            totalActiveListings: listing.length,
            data: formattedListings
        })
    } catch (error) {
        console.error("Error retrieving listings", error)
        return res.status(500).json({
            success: false,
            message: error
        })
    }
})

export const updateListingCalendar = asyncHandler(async(req, res) => {
    console.log("Updating calendar listing...".yellow);

    const { listingId, newAvailableDays, blockedDays, pricePerNight, discount, markUnavailable } = req.body;

    try {
        // Fetch the listing by its ID
        const listing = await Listing.findById(listingId);
        if (!listing) {
            console.log("Listing not found".red);
            return res.status(404).json({
                success: false,
                message: "Listing not found",
            });
        }

        // Check for conflicts in newAvailableDays
        if (newAvailableDays && newAvailableDays.length > 0) {
            const conflictingAvailableDays = newAvailableDays.filter(date => 
                listing.calendar.bookedDays.includes(date)
            );

            if (conflictingAvailableDays.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot unblock dates ${conflictingAvailableDays.join(', ')}, currently booked.`,
                });
            }

            if (listing.calendar.availableDays.length === 0) {
                // If availableDays is empty, remove newAvailableDays from blockedDays
                listing.calendar.blockedDays = listing.calendar.blockedDays.filter(
                    (blockedDate) => !newAvailableDays.includes(blockedDate)
                );
            } else {
                // If availableDays is not empty, add newAvailableDays to availableDays
                listing.calendar.availableDays = [
                    ...new Set([
                        ...listing.calendar.availableDays, 
                        ...newAvailableDays
                    ])
                ];
            }
        }

        // Fetch all bookings for the current listing
        const bookings = await Booking.find({ 
            listing: listingId,
            paystackPaymentStatus: "success"
         });

        if(bookings) {
            console.log(`${bookings.length} bookings found`.yellow)
        }

        // Check if any of the bookings have future bookedDays
        const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        const futureBookings = bookings.filter(booking => 
            booking.bookedDays.some(bookedDay => bookedDay >= today)
        );

        // If future bookings exist, prevent certain updates
        if (futureBookings.length > 0) {
            let conflictFields = [];
        
            // Check for each field and add to the conflictFields array if it's being updated
            if (pricePerNight) {
                conflictFields.push("price per night");
            }
            if (typeof discount !== "undefined") {
                conflictFields.push("discount");
            }
            if (markUnavailable === true) {
                conflictFields.push("mark unavailable");
            }
        
            // If there are any conflicting fields, return a message
            if (conflictFields.length > 0) {
                const fieldNames = conflictFields.join(', ').replace(/, ([^,]*)$/, ' and $1');
                console.log(`Cannot update ${fieldNames} due to future bookings.`.red);
        
                return res.status(400).json({
                    success: false,
                    message: `Cannot update ${fieldNames} due to future bookings.`,
                });
            }
        }
        

        // Handle newAvailableDays logic
        if (newAvailableDays && newAvailableDays.length > 0) {
            if (listing.calendar.availableDays.length === 0) {
                // If availableDays is empty, remove newAvailableDays from blockedDays
                listing.calendar.blockedDays = listing.calendar.blockedDays.filter(
                    (blockedDate) => !newAvailableDays.includes(blockedDate)
                );
            } else {
                // If availableDays is not empty, add newAvailableDays to availableDays
                listing.calendar.availableDays = [
                    ...new Set([
                        ...listing.calendar.availableDays,
                        ...newAvailableDays
                    ])
                ];
            }
        }

        // Handling blockedDays logic
        if (blockedDays && blockedDays.length > 0) {
            // Add new blockedDays, avoid duplicates
            listing.calendar.blockedDays = [...new Set([...listing.calendar.blockedDays, ...blockedDays])];
        }

        // Handle pricePerNight logic
        if (pricePerNight && futureBookings.length === 0) {
            listing.chargePerNight = pricePerNight;
        }

        // Handle discount logic (boolean)
        if (typeof discount === "boolean" && futureBookings.length === 0) {
            listing.discount = discount;
        }

        // Handle markUnavailable logic (boolean)
        if (typeof markUnavailable === "boolean" && futureBookings.length === 0) {
            if (markUnavailable) {
                listing.status = "unlisted";
                listing.listingStatus = "marked-unavailable";
            } else {
                listing.status = "listed";
                listing.listingStatus = "approved";
            }
        }

        // Save the updated listing
        await listing.save();

        const formattedListings = {
            todaysDate: formatDateWithoutTime(new Date()),
            id: listing._id,
            status: listing.status,
            listingStatus: listing.listingStatus,
            listingImage: listing.bedroomPictures[0]?.secure_url,
            propertyName: listing.propertyName,
            roomNumber: listing.propertyLocation.apartmentNumber,
            listingId: listing.propertyId,
            location: `${listing.propertyLocation.address}, ${listing.propertyLocation.state}, Nigeria`,
            bookedDays: listing.calendar.bookedDays,
            blockedDays: listing.calendar.blockedDays,
            availableDays: listing.calendar.availableDays
        };

        res.status(200).json({
            success: true,
            message: "Listing updated successfully",
            data: formattedListings
        });
    } catch (error) {
        console.error("Error updating listing", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the listing",
        });
    }
});
