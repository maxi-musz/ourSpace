export const formatListingData = (data) => {
    console.log("Formatting listings".blue)
    return {
      user: data.user,
      propertyName: data.propertyName,
      propertyType: data.propertyType,
      status: data.status,
      bedroomTotal: Number(data.bedroomTotal),
      livingRoomTotal: Number(data.livingRoomTotal),
      bedTotal: Number(data.bedTotal),
      bathroomTotal: Number(data.bathroomTotal),
      freeCancellation: data.freeCancellation,
      toiletTotal: Number(data.toiletTotal),
      maximumGuestNumber: {
        adult: Number(data.maximumGuestNumber.adult),
        children: Number(data.maximumGuestNumber.children),
        pets: Number(data.maximumGuestNumber.pets),
        total: Number(data.maximumGuestNumber.total),
      },
      propertyLocation: {
        ...data.propertyLocation,
        apartmentNumber: Number(data.propertyLocation.apartmentNumber),
        apartmentSize: Number(data.propertyLocation.apartmentSize),
      },
      description: data.description,
      bedroomPictures: data.bedroomPictures,
      livingRoomPictures: data.livingRoomPictures,
      bathroomToiletPictures: data.bathroomToiletPictures,
      kitchenPictures: data.kitchenPictures,
      facilityPictures: data.facilityPictures,
      otherPictures: data.otherPictures,
      availableAmenities: data.availableAmenities,
      funPlacesNearby: data.funPlacesNearby,
      arrivalDepartureDetails: {
        checkIn: {
          date: Number(data.arrivalDepartureDetails.checkIn.date),
          month: Number(data.arrivalDepartureDetails.checkIn.month),
          year: Number(data.arrivalDepartureDetails.checkIn.year),
        },
        checkOut: {
          date: Number(data.arrivalDepartureDetails.checkOut.date),
          month: Number(data.arrivalDepartureDetails.checkOut.month),
          year: Number(data.arrivalDepartureDetails.checkOut.year),
        },
      },
      minimumDays: Number(data.minimumDays),
      infoForGuests: data.infoForGuests,
      guestMeansOfId: data.guestMeansOfId,
      chargeType: data.chargeType,
      chargeCurrency: data.chargeCurrency,
      acceptOtherCurrency: data.acceptOtherCurrency,
      pricePerGuest: Number(data.pricePerGuest),
      price: Number(data.price),
      discount: data.discount,
      cancellationOption: data.cancellationOption,

      
    };
  };
  console.log("Listings successfully formatted".yellow)
  