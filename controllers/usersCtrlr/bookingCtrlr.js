import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js"

const checkAvailability = asyncHandler(async (req, res) => {
    console.log("Checking availability before booking endpoint...".yellow);

    const { listingId } = req.params;
    const { checkIn, checkOut, spaceUsers } = req.body;

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
    checkAvailability
}
