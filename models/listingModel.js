import mongoose from "mongoose";

const propertyLocationSchema = new mongoose.Schema({
    address: {
      type: String,
      required: true
    },
    apartmentNumber: Number,
    apartmentSize: Number
  });
  
  const arrivalDepartureDetailsSchema = new mongoose.Schema({
    checkIn: {
      from: String,
      until: String
    },
    checkOut: {
      from: String,
      until: String
    }
  });
  
  const infoForGuestsSchema = new mongoose.Schema({
    petsAllowed: Boolean,
    kidsAllowed: Boolean,
    partiesAllowed: Boolean,
    smokingAllowed: Boolean,
    cctvAvailable: Boolean
  });
  
  const listingsSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    propertyName: {
      type: String,
      required: true
    },
    propertyType: {
      type: String,
      required: true
    },
    bedroomTotal: {
      type: Number,
      required: true
    },
    livingRoomTotal: {
      type: Number,
      required: true
    },
    bedTotal: {
      type: Number,
      required: true
    },
    bathroomTotal: {
      type: Number,
      required: true
    },
    toiletTotal: {
      type: Number,
      required: true
    },
    maximumGuestNumber: {
        type: Number
    },
    propertyLocation: propertyLocationSchema,
    description: String,
    bedroomPictures: {
      type: [String],
      required: true
    },
    livingRoomPictures: {
      type: [String],
      required: true
    },
    bathroomToiletPictures: {
      type: [String],
      required: true
    },
    kitchenPictures: {
      type: [String],
      required: true
    },
    facilityPictures: {
      type: [String],
      required: true
    },
    otherPictures: {
      type: [String],
      required: true
    },
    availableAmenities: [String],
    arrivalDepartureDetails: arrivalDepartureDetailsSchema,
    minimumDays: Number,
    infoForGuests: infoForGuestsSchema,
    guestMeansOfId: {
      type: String,
      enum: ['confirmation-mail/sms', 'government-id']
    },
    chargeType: {
      type: String,
      enum: ['daily', 'weekly']
    },
    chargeCurrency: String,
    acceptOtherCurrency: Boolean,
    pricePerGuest: Number,
    discount: Boolean,
    cancellationOption: {
      type: String,
      enum: ['flexible', 'moderate', 'firm', 'strict']
    }
  });
  
  const Listing = mongoose.model('Listing', listingsSchema);
  
  export default Listing;