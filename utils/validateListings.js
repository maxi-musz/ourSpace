// Helper function to validate required fields before approving the listing
 export function validateListingRequiredFields(listing) {
    const errors = [];

    // Check basic required fields
    if (!listing.propertyName) {
        errors.push('Property name is required');
    }
    if (!listing.propertyType || listing.propertyType.length === 0) {
        errors.push('Property type is required');
    }
    if (!listing.bedroomTotal) {
        errors.push('Total bedrooms are required');
    }
    if (!listing.bathroomTotal) {
        errors.push('Total bathrooms are required');
    }
    if (!listing.livingRoomTotal) {
        errors.push('Total living rooms are required');
    }
    if (!listing.bedTotal) {
        errors.push('Total beds are required');
    }
    if (!listing.toiletTotal) {
        errors.push('Total toilets are required');
    }
    if (!listing.description) {
        errors.push('Property description is required');
    }
    if (!listing.propertyLocation || !listing.propertyLocation.address || !listing.propertyLocation.city || !listing.propertyLocation.state) {
        errors.push('Property location (address, city, and state) is required');
    }
    if (!listing.chargeCurrency) {
        errors.push('Charge currency is required');
    }
    if (listing.chargePerNight == null) {
        errors.push('Charge per night is required');
    }
    if (listing.totalGuestsAllowed == null) {
        errors.push('Total guests allowed is required');
    }

    // Check if all image categories have at least one image
    const imageCategories = [
        { name: 'Bedroom pictures', key: 'bedroomPictures' },
        { name: 'Living room pictures', key: 'livingRoomPictures' },
        { name: 'Bathroom and toilet pictures', key: 'bathroomToiletPictures' },
        { name: 'Kitchen pictures', key: 'kitchenPictures' },
        { name: 'Facility pictures', key: 'facilityPictures' },
        { name: 'Other pictures', key: 'otherPictures' }
    ];

    imageCategories.forEach((category) => {
        if (!listing[category.key] || listing[category.key].length === 0) {
            errors.push(`${category.name} are required`);
        }
    });

    // Add other required field checks as needed (e.g., amenities, check-in/out details)

    return errors; // Return the list of errors, if any
}
