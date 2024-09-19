import express from "express";

import {admin, protect} from "../middleware/authMiddleware.js"
import { getAllMessages, getMessagesForAListing, sendMessage } from "../controllers/messageCtrlr.js";
import upload from "../uploadUtils/multer.js";


const router = express.Router();

router.route("/send-message").post(protect, upload.array('messageMedia'),sendMessage)
router.route("/get-all-messages").get(protect, getAllMessages)
router.route("/get-messages-for-a-listing").get(protect, getMessagesForAListing)

export default router;