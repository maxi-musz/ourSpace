import express from "express";
import { getAllNotifications, getAllSUBookings, getSpaceUserDashboard } from "../../controllers/profileCtrlr/profileCtrlr.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.route("/su-dashboard").get(protect, getSpaceUserDashboard)
router.route("/get-all-bookings").get(protect, getAllSUBookings)
router.route("/get-all-notifications").get(protect, getAllNotifications)

export default router;