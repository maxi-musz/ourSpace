import express from "express";
import { getWallet } from "../controllers/walletController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router()


router
.route("/get-wallet-dashboard")
.get(protect, getWallet)

export default router