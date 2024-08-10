import mongoose from "mongoose";

const propertyLocationSchema = new mongoose.Schema({
    address: {
      type: String,
    },
    apartmentNumber: Number,
    apartmentSize: Number
  });

  const dateSchema = new mongoose.Schema({
    date: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true }
});

const arrivalDepartureDetailsSchema = new mongoose.Schema({
  checkIn: dateSchema,
  checkOut: dateSchema
});

const numberOfGuestsSchema = new mongoose.Schema({
  adult: { type: Number },
  children: { type: Number },
  pets: { type: Number, default: 0 },
  total: {
      type: Number,
      required: true,
      default: function() {
          return this.adult + this.children;
      }
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
    status: { 
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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
    freeCancellation: {
      type: Boolean,
      default: false,
      required: true
    },
    toiletTotal: {
      type: Number,
      required: true
    },
    maximumGuestNumber: numberOfGuestsSchema,

    propertyLocation: propertyLocationSchema,

    city: {
      type: String,
    },

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

    funPlacesNearby: [String],

    bookedDays: {
      type: [dateSchema],  // Array of dateSchema to store booked days
      default: []
    },

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

    price: {
      type: Number,
      required: true
    },

    discount: Boolean,

    cancellationOption: {
      type: String,
      enum: ['flexible', 'moderate', 'firm', 'strict']
    }
  });
  
  const Listing = mongoose.model('Listing', listingsSchema);
  
  export default Listing;