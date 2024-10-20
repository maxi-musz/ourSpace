import express from "express";
import { getBookingPDF, getSingleBookingFromWalletDashboard, getWallet } from "../controllers/walletController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router()


router
.route("/get-wallet-dashboard")
.get(protect, getWallet)

router
.route("/view-payment-invoice")
.get(protect, getSingleBookingFromWalletDashboard)

router
.route("/download-invoice-as-pdf")
.get(protect, getBookingPDF)
export default router

