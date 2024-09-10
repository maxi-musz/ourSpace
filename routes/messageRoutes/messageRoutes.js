import express from "express";
import { getMessages, sendMessage } from "../../controllers/messageCtrlr/messageCtrlr.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.route("/send-message").post(protect, sendMessage)
router.route("/get-message/:listingId").get(protect, getMessages)

export default router;