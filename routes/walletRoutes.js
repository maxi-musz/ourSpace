import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getBookingPDF, soGetSingleBookingFromWalletDashboard, spaceOwnerGetBanksAndSavedAccount, spaceOwnerGetWallet, spaceOwnerSaveNewAccountDetails, spaceOwnerVerifyAccountNumber } from "../controllers/walletController.js";

const router = express.Router()


router
.route("/so-get-wallet-dashboard")
.get(protect, spaceOwnerGetWallet)

router
.route("/so-view-payment-invoice")
.get(protect, soGetSingleBookingFromWalletDashboard)

router
.route("/so-download-invoice-as-pdf")
.get(protect, getBookingPDF)

router
.route("/so-withdraw-funds")
.get(protect, spaceOwnerGetBanksAndSavedAccount)

router
.route("/so-verify-account-number")
.post(protect, spaceOwnerVerifyAccountNumber)

router
.route("/so-save-new-bank-details")
.post(protect, spaceOwnerSaveNewAccountDetails)

router
.route("/so-save-new-bank-details")
.post(protect, spaceOwnerSaveNewAccountDetails)

export default router

