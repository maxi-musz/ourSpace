import mongoose from "mongoose";

const propertyLocationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, "Address is required"]
  },
    city: {
      type: String,
      required: [true, "City is required"]
    },
    state: {
      type: String,
      required: [true, "State is required"]
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
  
const draftListingsSchema = new mongoose.Schema({
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
      default: "draft",
    },
    listedOnOtherPlatform: {
      type: Boolean,
      required: [true, "listed on other platform which is of type boolean is required"]
    },
    propertyName: {
      type: String,
      required: [true, "Property name is required"]
    },
    propertyType: { 
      type: String,
      required: [true, "Property type is required"]
    },
    bedroomTotal: {
      type: Number,
      required: [true, "Bedroom total is required"]
    },
    livingRoomTotal: {
      type: Number,
      required: [true, "Living room total is required"]
    },
    bedTotal: {
      type: Number,
      required: [true, "Bed total is required"]
    },
    bathroomTotal: {
      type: Number,
      required: [true, "Total number of bathrooms is required"]
    },
    toiletTotal: {
      type: Number,
      required: [true, "Total number of toilets is required"]
    },

    propertyLocation: propertyLocationSchema,

    description: {
      type: String,
      required: [true, "Property description is required"]
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
    },
    
    infoForGuests: infoForGuestsSchema,

    guestMeansOfId: {
      confirmationMail: {
        type: Boolean,
      },
      idCard: {
        type: Boolean,
      }
    },

    chargeType: {
      type: String,
      enum: ['daily', 'weekly', 'yearly']
    },

    chargeCurrency: {
      type: String
    },

    acceptOtherCurrency: {
      type: Boolean
    },

    otherAcceptedCurrencies: [String],

    chargePerNight: {
      type: Number
    },

    discount: {
      type: Boolean
    },

    cancellationOption: {
      type: String,
      enum: ['flexible', 'moderate', 'firm', 'strict']
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
      type: Number
    },
    
    freeCancellation: {
      type: Boolean,
      default: false
    },
    maximumGuestNumber: numberOfGuestsSchema,

}, {
  timestamps: true
});

draftListingsSchema.pre('save', function (next) {
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

draftListingsSchema.pre('save', function (next) {
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
  
const DraftListing = mongoose.model('DraftListing', draftListingsSchema);

export default DraftListing;