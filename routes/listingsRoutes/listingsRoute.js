import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { createListing } from '../../controllers/listingCtrlrs/listingCtrls.js';

const router = express.Router();

router.route('/create-listing').post(protect, createListing);

export default router;
