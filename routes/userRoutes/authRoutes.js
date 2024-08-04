import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js"

import {
    loginUser,
    refreshToken,
    registerUser,
} from "../../controllers/userCtrls/authController.js"

const router = express.Router();

router
.route('/')
.post(registerUser)

router
.route('/sign-in')
.post(loginUser)

router
.route('/refresh')
.post(refreshToken)




export default router;
