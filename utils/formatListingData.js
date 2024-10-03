const formatListingData = (req) => {
<<<<<<< HEAD
    const formatDate = (year, month, day) => {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };
  
    return {
      user: req.body.user,
      listedOnOtherPlatform: req.body.listedOnOtherPlatform,
      propertyName: req.body.propertyName,
      propertyType: req.body.propertyType,
      bedroomTotal: parseInt(req.body.bedroomTotal, 10),
      livingRoomTotal: parseInt(req.body.livingRoomTotal, 10),
      bedTotal: parseInt(req.body.bedTotal, 10),
      toiletTotal: parseInt(req.body.toiletTotal, 10),
      bathroomTotal: parseInt(req.body.bathroomTotal, 10),
      freeCancellation: req.body.freeCancellation === 'true',
      totalGuestsAllowed: parseInt(req.body.totalGuestsAllowed),
      // maximumGuestNumber: {
      //   adult: parseInt(req.body['maximumGuestNumber.adult'], 10),
      //   children: parseInt(req.body['maximumGuestNumber.children'], 10),
      //   pets: parseInt(req.body['maximumGuestNumber.pets'], 10)
      // },
      propertyLocation: {
        address: req.body['propertyLocation.address'],
        city: req.body['propertyLocation.city'],
        state: req.body['propertyLocation.state'],
        apartmentNumber: parseInt(req.body['propertyLocation.apartmentNumber'], 10),
        apartmentSize: parseInt(req.body['propertyLocation.apartmentSize'], 10)
      },
      description: req.body.description,
      availableAmenities: {
        propertyAmenities: Array.isArray(req.body.propertyAmenities)
          ? req.body.propertyAmenities.map(item => item.trim())
          : req.body.propertyAmenities
          ? req.body.propertyAmenities.split(',').map(item => item.trim())
          : [],
        roomFeatures: Array.isArray(req.body.roomFeatures)
          ? req.body.roomFeatures.map(item => item.trim())
          : req.body.roomFeatures
          ? req.body.roomFeatures.split(',').map(item => item.trim())
          : [],
        outdoorActivities: Array.isArray(req.body.outdoorActivities)
          ? req.body.outdoorActivities.map(item => item.trim())
          : req.body.outdoorActivities
          ? req.body.outdoorActivities.split(',').map(item => item.trim())
          : [],
      },

      arrivalDepartureDetails: {
        checkIn: {
          from: req.body["arrivalDepartureDetails.checkIn.from"],
          to: req.body["arrivalDepartureDetails.checkIn.from"],
        }, 
        checkOut: {
          from: req.body["arrivalDepartureDetails.checkOut.from"],
          to: req.body["arrivalDepartureDetails.checkOut.to"],
        },  
      },

      minimumDays: parseInt(req.body.minimumDays, 10),

      infoForGuests: {
        petsAllowed: req.body['infoForGuests.petsAllowed'],
        kidsAllowed: req.body['infoForGuests.kidsAllowed'],
        partiesAllowed: req.body['infoForGuests.partiesAllowed'],
        smokingAllowed: req.body['infoForGuests.smokingAllowed'],
        cctvAvailable: req.body['infoForGuests.cctvAvailable']
      },

      guestMeansOfId: {
        confirmationMail: req.body['guestMeansOfId.confirmationMail'],
        idCard: req.body['guestMeansOfId.idCard'],
      },

      chargeType: req.body.chargeType, 
      
      chargeCurrency: req.body.chargeCurrency,

      acceptOtherCurrency: req.body.acceptOtherCurrency === 'true' || req.body.acceptOtherCurrency === true,
      
      otherAcceptedCurrencies: Array.isArray(req.body.otherAcceptedCurrencies) 
          ? req.body.otherAcceptedCurrencies 
          : req.body.otherAcceptedCurrencies 
              ? req.body.otherAcceptedCurrencies.split(',') 
              : [],

      chargePerNight: parseFloat(req.body.chargePerNight),
      
      discount: req.body.discount === 'true',

      cancellationOption: req.body.cancellationOption,

      pricePerGuest: parseFloat(req.body.pricePerGuest),

      availability: Array.isArray(req.body.availability) 
          ? req.body.availability 
          : req.body.availability 
              ? req.body.availability.split(',') 
              : [],                                 
      bookedDays: Array.isArray(req.body.bookedDays) 
          ? req.body.bookedDays 
          : req.body.bookedDays 
              ? req.body.bookedDays.split(',') 
              : [],                              
    };
};

=======
  const formatDate = (year, month, day) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const safeParseInt = (value) => {
    if (value === undefined || value === null || isNaN(parseInt(value, 10))) {
      return undefined; // Or any default value that makes sense for your context.
    }
    return parseInt(value, 10);
  };

  const safeParseFloat = (value) => {
    if (value === undefined || value === null || isNaN(parseFloat(value))) {
      return undefined; // Or any default value that makes sense for your context.
    }
    return parseFloat(value);
  };

  return {
    user: req.body.user,
    listedOnOtherPlatform: req.body.listedOnOtherPlatform,
    propertyName: req.body.propertyName,
    propertyType: req.body.propertyType,
    bedroomTotal: safeParseInt(req.body.bedroomTotal),
    livingRoomTotal: safeParseInt(req.body.livingRoomTotal),
    bedTotal: safeParseInt(req.body.bedTotal),
    toiletTotal: safeParseInt(req.body.toiletTotal),
    bathroomTotal: safeParseInt(req.body.bathroomTotal),
    freeCancellation: req.body.freeCancellation === 'true' || req.body.freeCancellation === true,
    totalGuestsAllowed: safeParseInt(req.body.totalGuestsAllowed),

    propertyLocation: {
      address: req.body['propertyLocation.address'],
      city: req.body['propertyLocation.city'],
      state: req.body['propertyLocation.state'],
      apartmentNumber: req.body['propertyLocation.apartmentNumber'] ? safeParseInt(req.body['propertyLocation.apartmentNumber']) : null,
      apartmentSize: req.body['propertyLocation.apartmentSize'] ? safeParseFloat(req.body['propertyLocation.apartmentSize']) : null
    },

    description: req.body.description,

    availableAmenities: {
      propertyAmenities: Array.isArray(req.body.propertyAmenities)
        ? req.body.propertyAmenities.map(item => item.trim())
        : req.body.propertyAmenities
        ? req.body.propertyAmenities.split(',').map(item => item.trim())
        : [],
      roomFeatures: Array.isArray(req.body.roomFeatures)
        ? req.body.roomFeatures.map(item => item.trim())
        : req.body.roomFeatures
        ? req.body.roomFeatures.split(',').map(item => item.trim())
        : [],
      outdoorActivities: Array.isArray(req.body.outdoorActivities)
        ? req.body.outdoorActivities.map(item => item.trim())
        : req.body.outdoorActivities
        ? req.body.outdoorActivities.split(',').map(item => item.trim())
        : []
    },

    arrivalDepartureDetails: {
      checkIn: {
        from: req.body["arrivalDepartureDetails.checkIn.from"],
        to: req.body["arrivalDepartureDetails.checkIn.to"]
      }, 
      checkOut: {
        from: req.body["arrivalDepartureDetails.checkOut.from"],
        to: req.body["arrivalDepartureDetails.checkOut.to"]
      }
    },

    minimumDays: safeParseInt(req.body.minimumDays),

    infoForGuests: {
      petsAllowed: req.body['infoForGuests.petsAllowed'],
      kidsAllowed: req.body['infoForGuests.kidsAllowed'],
      partiesAllowed: req.body['infoForGuests.partiesAllowed'],
      smokingAllowed: req.body['infoForGuests.smokingAllowed'],
      cctvAvailable: req.body['infoForGuests.cctvAvailable']
    },

    guestMeansOfId: {
      confirmationMail: req.body['guestMeansOfId.confirmationMail'],
      idCard: req.body['guestMeansOfId.idCard']
    },

    chargeType: req.body.chargeType,
    chargeCurrency: req.body.chargeCurrency,
    acceptOtherCurrency: req.body.acceptOtherCurrency === 'true' || req.body.acceptOtherCurrency === true,
    
    otherAcceptedCurrencies: Array.isArray(req.body.otherAcceptedCurrencies)
      ? req.body.otherAcceptedCurrencies
      : req.body.otherAcceptedCurrencies
          ? req.body.otherAcceptedCurrencies.split(',')
          : [],

    chargePerNight: safeParseFloat(req.body.chargePerNight),

    discount: req.body.discount === 'true' || req.body.discount === true,

    cancellationOption: req.body.cancellationOption,

    calendar: {
      availableDays: Array.isArray(req.body['calendar.availableDays'])
        ? req.body['calendar.availableDays']
        : req.body['calendar.availableDays']
          ? req.body['calendar.availableDays'].split(',').map(date => date.trim())
          : [],

      blockedDays: Array.isArray(req.body['calendar.blockedDays'])
        ? req.body['calendar.blockedDays']
        : req.body['calendar.blockedDays']
          ? req.body['calendar.blockedDays'].split(',').map(date => date.trim())
          : [],

      bookedDays: Array.isArray(req.body['calendar.bookedDays'])
        ? req.body['calendar.bookedDays']
        : req.body['calendar.bookedDays']
          ? req.body['calendar.bookedDays'].split(',').map(date => date.trim())
          : []
    },
  };
};


>>>>>>> ourspace/test
export default formatListingData;
