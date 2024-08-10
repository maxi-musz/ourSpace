import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { createListing, filterListings, getAllListings, searchListings } from '../../controllers/listingCtrlrs/listingCtrls.js';
import upload from '../../uploadUtils/multer.js';

const router = express.Router();

router
.route('/')
.get(getAllListings);

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
.get(filterListings)



export default router;
 