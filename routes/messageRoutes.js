import express from "express";

import {admin, protect} from "../middleware/authMiddleware.js"
import { getAllMessages, sendMessage } from "../controllers/messageCtrlr.js";
import upload from "../uploadUtils/multer.js";


const router = express.Router();

router.route("/send-message").post(protect, upload.array('messageMedia'),sendMessage)
router.route("/get-messages").get(protect, getAllMessages)

export default router;