import express from 'express';
import { addNewReview } from '../../controllers/reviewsCtrlr/reviewsCtrlr.js';
import upload from '../../uploadUtils/multer.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router
  .route("/create-review")
  .post(protect, upload.array('reviewImages', 10), addNewReview);

export default router;


 