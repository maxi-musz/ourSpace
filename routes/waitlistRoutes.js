import express from "express";
import { joinwWaitList } from "../controllers/waitlistCtrl.js";

const router = express.Router();

router
.route('/join-waitlist')
.post(joinwWaitList)

export default router

