import express from "express";
import { getAllNotifications, getAllSUBookings, getSpaceOwnerDashboard, getSpaceUserDashboard, getSUBookingHistory } from "../controllers/profileCtrlr.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/su-get-dashboard").get(protect, getSpaceUserDashboard)
router.route("/get-all-bookings").get(protect, getAllSUBookings)
router.route("/get-all-notifications").get(protect, getAllNotifications)
router.route("/su-get-all-booking-history").get(protect, getSUBookingHistory)

                        /// SPACE OWNERS
router.route("/so-get-dashboard").get(protect, getSpaceOwnerDashboard)

export default router;

