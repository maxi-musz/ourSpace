import express from "express";

import { 
    joinwWaitList,
    getWaitlistsRouteHandler
} from "../controllers/waitlistCtrl.js";

const router = express.Router();

router
.route('/join-waitlist')
.post(joinwWaitList)

router
.route('/get-waitlists')
.get(getWaitlistsRouteHandler)

export default router

