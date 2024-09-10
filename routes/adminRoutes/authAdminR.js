import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { 
    generateOtp,
    verifyOtp
 } from "../../controllers/adminCtrls/authAdminC.js";

const router = express.Router()

router
.route("/log-in")
.post(generateOtp) 

router.
route('/verify-otp')
.post(verifyOtp);

export default router

