import express from "express";
import { getCalendar, updateListingCalendar } from "../controllers/calendarController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router()

router
.route("/")
.get(protect, getCalendar)

router
.route("/updated-listing-calendar")
.patch(protect, updateListingCalendar)

export default router

