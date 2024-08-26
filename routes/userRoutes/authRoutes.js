import express from "express";

import {
    suLogin,
    soLogin,
    refreshToken,
    spaceUserSignUp,
    spaceOwnerSignUp,
    continueWithGoogle,
    googleCallback,
} from "../../controllers/userCtrls/authController.js"

const router = express.Router();

// space users
router
.route('/su-register')
.post(spaceUserSignUp)

router
.route('/su-login')
.post(suLogin)

// Space Owners
router
.route('/so-register')
.post(spaceOwnerSignUp)

router
.route('/so-login')
.post(soLogin)

router
.route('/refresh')
.post(refreshToken)

router.get('/google', continueWithGoogle);

router.get('/auth/google/callback', googleCallback);




export default router;
