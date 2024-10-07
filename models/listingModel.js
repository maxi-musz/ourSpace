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
    apartmentNumber: {type: String, default: null},
    apartmentSize: {type: String, default: null}
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

const imageSchema = new mongoose.Schema({
  secure_url: { type: String, required: true },
  public_id: { type: String }
});
  
const listingsSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    propertyId: {
      type: String,
      required: true
    },
    propertyUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
    }],
    status: {
      type: String,
      enum: ["listed", "unlisted"],
      default: "unlisted"
    },
    listingStatus: { 
      type: String,
      enum: ["approved", "rejected","active", "inactive", "pending", "draft", "saved", "archived", "blocked"],
      default: "pending",
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
    bedroomTotal: {
      type: Number,
      required: [true, 'bedroom total is required']
    },
    livingRoomTotal: {
      type: Number,
      required: [true, 'living room total is required']
    },
    bedTotal: {
      type: Number,
      required: [true, 'bed total is required']
    },
    bathroomTotal: {
      type: Number,
      required: [true, 'bathroom total is required'] 
    },
    toiletTotal: {
      type: Number,
      required: [true, 'toilet total is required']
    },

    propertyLocation: propertyLocationSchema,

    description: {
      type: String
    },

    bedroomPictures: [imageSchema],
    livingRoomPictures: [imageSchema],
    bathroomToiletPictures: [imageSchema],
    kitchenPictures: [imageSchema],
    facilityPictures: [imageSchema],
    otherPictures: [imageSchema],

    availableAmenities: {
      propertyAmenities: [String],
      roomFeatures: [String],
      outdoorActivities: [String],
      allAmenities: [String]
    },

    arrivalDepartureDetails: {
      checkIn: {
        from: {
          type: String,
        },
        to: {
          type: String
        }
      },
      checkOut: {
        from: {
          type: String,
        },
        to: {
          type: String
        }
      }
    },

    minimumDays: {
      type: Number,
      default: 1,
    },
    
    infoForGuests: infoForGuestsSchema,

    guestMeansOfId: {
      confirmationMail: {
        type: Boolean,
        default: false
      },
      idCard: {
        type: Boolean,
        default: false
      }
    },

    chargeType: {
      type: String,
      enum: ['daily', 'weekly', 'yearly'],
      default: "daily"
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
    },

    calendar: {
      availableDays: {
        type: [String],
        default: []
      },
      blockedDays: {
        type: [String],
        default: []
      },
      bookedDays: {
        type: [String],
        default: []
      },
      unavailableDays: {
        type: [String],
        default: function() {
          return [...new Set([...this.calendar.blockedDays, ...this.calendar.bookedDays])];
        }
      }
    },

    totalGuestsAllowed: {
      type: Number,
      required: [true, "Total allowed guests is required"]
    },
    
    freeCancellation: {
      type: Boolean,
      default: false,
      required: true
    },
    maximumGuestNumber: numberOfGuestsSchema,

}, {
  timestamps: true
});

listingsSchema.pre('save', function (next) {
  if (!this.availableAmenities) {
      this.availableAmenities = {};
  }

  const amenities = new Set([
    ...(this.availableAmenities.propertyAmenities || []),
    ...(this.availableAmenities.roomFeatures || []),
    ...(this.availableAmenities.outdoorActivities || [])
  ]);

  this.availableAmenities.allAmenities = Array.from(amenities);
  next();
});

listingsSchema.pre('save', function (next) {
  if (!this.calendar) {
    this.calendar = {};
  }

  // Combine blockedDays and bookedDays to form unavailableDays
  const unavailableDays = new Set([
    ...(this.calendar.blockedDays || []),
    ...(this.calendar.bookedDays || [])
  ]);

  this.calendar.unavailableDays = Array.from(unavailableDays);
  next();
});
  
const Listing = mongoose.model('Listing', listingsSchema);

export default Listing;