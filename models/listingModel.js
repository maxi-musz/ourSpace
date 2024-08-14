import mongoose from "mongoose";

const propertyLocationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, "city is required"]
  },
    city: {
      type: String,
      required: [true, "city is required"]
    },
    state: {
      type: String,
      required: [true, "state is required"]
    },
    latitude: Number,
    longitude: Number,
    apartmentNumber: Number,
    apartmentSize: Number
});

const dateSchema = new mongoose.Schema({
  date: { 
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /\d{4}-\d{2}-\d{2}/.test(v); // Regex to validate YYYY-MM-DD format
      },
      message: props => `${props.value} is not a valid date format!`
    }
  }
});
  

const arrivalDepartureDetailsSchema = new mongoose.Schema({
  checkIn: {
    type: String,  // YYYY-MM-DD format
    required: true,
    validate: {
      validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),  // Validate the date format
      message: props => `${props.value} is not a valid date!`
    }
  },
  checkOut: {
    type: String,  // YYYY-MM-DD format
    required: true,
    validate: {
      validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),  // Validate the date format
      message: props => `${props.value} is not a valid date!`
    }
  }
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
    listedOnOtherPlatform: {
      type: Boolean,
      default: false,
      required: true
    },
    propertyName: {
      type: String,
      required: [true, 'Property name is required.']
    },
    propertyType: { 
      type: String,
      required: [true, 'Property type is required.']
    },
    propertyId: { 
      type: String,
      required: [true, 'Property id is required.']
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

    totalGuestsAllowed: {
      type: Number,
      required: [true, "maximum allowed guests is required"]
    },

    propertyLocation: propertyLocationSchema,

    status: { 
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: [true, 'Property status is required.']
    },
    freeCancellation: {
      type: Boolean,
      default: false,
      required: true
    },
    maximumGuestNumber: numberOfGuestsSchema,

    description: {
      type: String
    },
    
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

    funPlacesNearby: [String],
    
    minimumDays: {
      type: Number,
      default: 1,
      required: [true, "Minimum allowed days is required"]
    },
    
    infoForGuests: infoForGuestsSchema,
    
    guestMeansOfId: {
      type: String,
      enum: ['confirmation-mail/sms', 'government-id']
    },

    chargeCurrency: {
      type: String,
      default: "ngn",
      required: [true, "Charge currency is required"]
    },

    acceptOtherCurrency: {
      type: Boolean,
      required: [true, "Accept other currecny attestation is required"]
    },

    otherAcceptedCurrencies: [String],

    chargePerNight: {
      type: Number,
      required: [true, "How much to be charged per night is required"]
    },

    discount: {
      type: Boolean,
      default: false,
      required: [true, "discount is required"]    
    },

    cancellationOption: {
      type: String,
      enum: ['flexible', 'moderate', 'firm', 'strict'],
      default: "flexible",
      required: [true, "Cancellation option is required"]
    },

    chargeType: {
      type: String,
      enum: ['daily', 'weekly']
    },

    bookedDays: {
      type: [String],
      default: []
    },

    availability: {
      type: [String],
      default: []
    },
    
  });
  
  const Listing = mongoose.model('Listing', listingsSchema);
  
  export default Listing;