import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js"

import {
    loginUser,
    registerUser,
    
} from "../controllers/authController.js"

const router = express.Router();

router
.route('/')
.post(registerUser)

router
.route('/sign-in')
.post(loginUser)

router
.route('/user-details')
.get(protect, loginUser)

export default router;