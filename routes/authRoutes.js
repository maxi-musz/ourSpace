import express from "express";

import {
    suLogin,
    soLogin,
    refreshToken,
    spaceUserSignUp,
    spaceOwnerSignUp,
    continueWithGoogle,
    googleCallback,
    generateOtp,
    verifyOtp,
    sendResetPasswordLink,
    resetPassword,
    getCurrentUser,
} from "../controllers/authController.js"
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// space users
router.route('/su-register').post(spaceUserSignUp)
router.route('/su-login').post(suLogin)

// Space Owners
router.route('/so-register').post(spaceOwnerSignUp)
router.route('/so-login').post(soLogin)

router.route('/get-current-user').get(protect, getCurrentUser);

router.route('/generate-otp').post(generateOtp);
router.route('/verify-otp').post(verifyOtp);

router.route('/refresh').post(refreshToken)

router.route('/google').post(continueWithGoogle);
router.route('/auth/google/callback').get(googleCallback);

router.route('/send-password-reset-link').post(sendResetPasswordLink);

router.route("/reset-password").post(resetPassword);

export default router;
