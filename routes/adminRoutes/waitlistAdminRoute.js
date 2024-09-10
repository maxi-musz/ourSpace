import express from "express";
import { getAllWaitlistData } from "../../controllers/adminCtrls/waitlistAdminCtrlr.js";
import { admin, protect } from "../../middleware/authMiddleware.js";

const router = express.Router()

router.route("/get-all-waitlist-data").get(protect, admin, getAllWaitlistData)

export default router

