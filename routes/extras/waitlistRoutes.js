import express from "express";

import { 
    joinwWaitList,
    getWaitlistsRouteHandler,
<<<<<<< HEAD
    joinNewsletter
=======
    joinNewsletter,
>>>>>>> ourspace/test
} from "../../controllers/extras/waitlistCtrl.js";
import { admin, protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router
.route('/join-waitlist')
.post(joinwWaitList)

router
.route('/send-waitlist-as-csv')
.get(protect, admin, getWaitlistsRouteHandler)

router
.route('/join-newsletter')
.post(joinNewsletter)

export default router

