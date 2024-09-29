import mongoose from "mongoose";

const propertyLocationSchema = new mongoose.Schema({
  address: {
    type: String,
  },
    city: {
      type: String,

    },
    state: {
      type: String,
    },
    latitude: Number,
    longitude: Number,
    apartmentNumber: {type: Number, default: null},
    apartmentSize: {type: Number, default: null}
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
      required: [true, "Listed on other platform which is a boolean is required"]
    },
    propertyName: {
      type: String,
      required: [true, "Property name is required"]
    },
    propertyType: { 
      type: String,
    },
    bedroomTotal: {
      type: Number,
    },
    livingRoomTotal: {
      type: Number,
    },
    bedTotal: {
      type: Number,
    },
    bathroomTotal: {
      type: Number,
    },
    toiletTotal: {
      type: Number,
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