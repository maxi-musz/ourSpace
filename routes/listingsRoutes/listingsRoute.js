import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { 
    createListing, 
    filterListings,
    getBookingHistory,
    getSingleListing,
    getUserListings,
    searchListings
 } from '../../controllers/listingCtrlrs/listingCtrls.js';
import upload from '../../uploadUtils/multer.js';
import { editListing } from '../../controllers/adminCtrls/listingsAdminC.js';

const router = express.Router();

// Create listing
router
.route('/create-listings')
.post(protect, upload.fields([
{ name: 'bedroomPictures', maxCount: 10 },
{ name: 'livingRoomPictures', maxCount: 10 },
{ name: 'bathroomToiletPictures', maxCount: 10 },
{ name: 'kitchenPictures', maxCount: 10 },
{ name: 'facilityPictures', maxCount: 10 },
{ name: 'otherPictures', maxCount: 10 }
]), createListing);

router
.route("/search")
.post(searchListings)

router
.route("/filter")
.post(filterListings)

// Get user listings
router
.route("/get-user-listings")
.get(protect, getUserListings)

// Get user listings
router
.route("/get-user-single-listings/:id")
.get(protect, getSingleListing)


router
  .route('/edit-listing/:id')
  .put(protect, upload.fields([
    { name: 'bedroomPictures', maxCount: 10 },
    { name: 'livingRoomPictures', maxCount: 10 },
    { name: 'bathroomToiletPictures', maxCount: 10 },
    { name: 'kitchenPictures', maxCount: 10 },
    { name: 'facilityPictures', maxCount: 10 },
    { name: 'otherPictures', maxCount: 10 }
  ]), editListing);

// Get listings Bookings
router
.route("/get-listing-bookings")
.get(protect, getBookingHistory)

export default router;
 