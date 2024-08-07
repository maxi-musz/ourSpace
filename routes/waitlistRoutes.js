import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";

import { 
    joinwWaitList,
    getWaitlists
} from "../controllers/waitlistCtrl.js";

const router = express.Router();

router
.route('/join-waitlist')
.post(joinwWaitList)

router
.route('/get-waitlists')
.post(protect, getWaitlists)

export default router

