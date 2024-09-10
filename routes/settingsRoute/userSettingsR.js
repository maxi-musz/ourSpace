import express from "express";
import { editProfileInfo } from "../../controllers/settingsCtrlr/userSettingsCtrlr.js";
import { protect } from "../../middleware/authMiddleware.js";
import upload from "../../uploadUtils/multer.js";

const router = express.Router();

router.route("/edit-profile-info").put(protect, upload.single('profilePic'), editProfileInfo)

export default router;