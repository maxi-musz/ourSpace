import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { createListing, filterListings, getAllListings } from '../../controllers/listingCtrlrs/listingCtrls.js';

const router = express.Router();

router
.route('/')
.get(getAllListings);

router
.route('/create-listing')
.post(protect, createListing);



router
.route("/filter")
.get(filterListings)



export default router;
 