const formatListingData = (req) => {
    const formatDate = (year, month, day) => {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };
  
    return {
      user: req.body.user,
      listedOnOtherPlatform: req.body.listedOnOtherPlatform,
      propertyName: req.body.propertyName,
      propertyType: req.body.propertyType,
      propertyId: req.body.propertyId,
      bedroomTotal: parseInt(req.body.bedroomTotal, 10),
      livingRoomTotal: parseInt(req.body.livingRoomTotal, 10),
      bedTotal: parseInt(req.body.bedTotal, 10),
      toiletTotal: parseInt(req.body.toiletTotal, 10),
      bathroomTotal: parseInt(req.body.bathroomTotal, 10),
      // status: req.body.status,
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
        latitude: parseInt(req.body['propertyLocation.latitude']),
        longitude: parseInt(req.body['propertyLocation.longitude']),
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
          from: req.body["arrivalDepartureDetails.checkInTime.from"],
          to: req.body["arrivalDepartureDetails.checkInTime.from"],
        }, 
        checkOut: {
          from: req.body["arrivalDepartureDetails.checkOutTime.from"],
          to: req.body["arrivalDepartureDetails.checkOutTime.to"],
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
              : [],                                 // List of YYYY-MM-DD strings
      bookedDays: Array.isArray(req.body.bookedDays) 
          ? req.body.bookedDays 
          : req.body.bookedDays 
              ? req.body.bookedDays.split(',') 
              : [],                                // List of YYYY-MM-DD strings

      // funPlacesNearby: Array.isArray(req.body.funPlacesNearby) 
      //     ? req.body.funPlacesNearby 
      //     : req.body.funPlacesNearby 
      //         ? req.body.funPlacesNearby.split(',') 
      //         : [],
    };
};

export default formatListingData;
