import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
<<<<<<< HEAD
import { editListing, getAllListings, getListingById, tempUpdateListingStatus, updateListingStatus, updateStatus } from "../../controllers/adminCtrls/listingsAdminC.js";
=======
import { getAllListings, getListingById, tempUpdateListingStatus, updateListingStatus, updateStatus } from "../../controllers/adminCtrls/listingsAdminC.js";
>>>>>>> ourspace/test
import upload from "../../uploadUtils/multer.js";

const router = express.Router()

router
.route("/all")
.get(protect, admin, getAllListings) 

router
.route("/:id")
.get(protect, admin, getListingById) 

<<<<<<< HEAD
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
=======
// router
//   .route('/edit-listing/:id')
//   .put(protect, admin, upload.fields([
//     { name: 'bedroomPictures', maxCount: 10 },
//     { name: 'livingRoomPictures', maxCount: 10 },
//     { name: 'bathroomToiletPictures', maxCount: 10 },
//     { name: 'kitchenPictures', maxCount: 10 },
//     { name: 'facilityPictures', maxCount: 10 },
//     { name: 'otherPictures', maxCount: 10 }
//   ]), editListing);
>>>>>>> ourspace/test

router
.route("/update-status")
.put(protect, admin, updateListingStatus) 

router
.route("/status-update")
.put(protect, admin, updateStatus) 

// router
// .route("/status-update")
// .put(protect, admin, tempUpdateListingStatus) 

export default router