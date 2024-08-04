import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { userDetails } from "../../controllers/adminCtrls/adminController.js";

const router = express.Router()

router
.route("/get-user")
.get(protect, userDetails) 

export default router