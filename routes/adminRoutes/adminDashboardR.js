import express from "express";

import { protect, admin } from "../../middleware/authMiddleware.js"
import { getAdminDashboard } from "../../controllers/adminCtrls/adminDashboard.js";

const router = express.Router()

router.route("/get-dashboard").get(protect, admin, getAdminDashboard)

export default router;