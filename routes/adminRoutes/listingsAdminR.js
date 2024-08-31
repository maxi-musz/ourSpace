import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { editListing, getAllListings, getListingById, updateListingStatus } from "../../controllers/adminCtrls/listingsAdminC.js";
import upload from "../../uploadUtils/multer.js";

const router = express.Router()

router
.route("/all")
.get(protect, admin, getAllListings) 

router
.route("/:id")
.get(protect, admin, getListingById) 

router
  .route('/edit-listing/:id')
  .put(protect, admin, upload.fields([
    { name: 'bedroomPictures', maxCount: 10 },
    { name: 'livingRoomPictures', maxCount: 10 },
    { name: 'bathroomToiletPictures', maxCount: 10 },
    { name: 'kitchenPictures', maxCount: 10 },
    { name: 'facilityPictures', maxCount: 10 },
    { name: 'otherPictures', maxCount: 10 }
  ]), editListing);

router
.route("/update-status/:listingId")
.post(protect, admin, updateListingStatus) 

export default router