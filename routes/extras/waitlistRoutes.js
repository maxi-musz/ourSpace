import express from "express";

import { 
    joinwWaitList,
    getWaitlistsRouteHandler,
    joinNewsletter
} from "../../controllers/extras/waitlistCtrl.js";
import { admin, protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router
.route('/join-waitlist')
.post(joinwWaitList)

router
.route('/get-waitlists')
.get(protect, admin, getWaitlistsRouteHandler)

router
.route('/join-newsletter')
.post(joinNewsletter)

export default router

