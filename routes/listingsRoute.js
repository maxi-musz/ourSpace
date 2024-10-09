import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
    createListing, 
    filterListings,
    getSingleListing,
    soGetAllListings,
    searchListings,
    editListing,
    saveListingForLater,
    deleteListing,
    getListingByCategory
 } from '../controllers/listingCtrls.js';
import upload from '../uploadUtils/multer.js';

const router = express.Router();

router
  .route('/save-as-draft')
  .put(protect, upload.fields([
    { name: 'bedroomPictures', maxCount: 10 },
    { name: 'livingRoomPictures', maxCount: 10 },
    { name: 'bathroomToiletPictures', maxCount: 10 },
    { name: 'kitchenPictures', maxCount: 10 },
    { name: 'facilityPictures', maxCount: 10 },
    { name: 'otherPictures', maxCount: 10 }
  ]), saveListingForLater);

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

router
.route("/get-user-listings")
.get(protect, soGetAllListings)

router
.route("/get-listings-by-category")
.get(getListingByCategory)

// Get user listings
router
.route("/get-user-single-listings/:id")
.get(getSingleListing)


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

router
.route("/delete-listing-or-draft")
.delete(protect, deleteListing)

export default router;
 