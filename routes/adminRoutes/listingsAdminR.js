import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { getAllListings } from "../../controllers/adminCtrls/listingsAdminC.js";

const router = express.Router()

router
.route("/all")
.get(protect, admin, getAllListings) 

export default router