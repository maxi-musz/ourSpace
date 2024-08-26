import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { userDetails } from "../../controllers/adminCtrls/usersAdminC.js";

const router = express.Router()

router
.route("/get-bookings")
.get(protect, userDetails) 

export default router