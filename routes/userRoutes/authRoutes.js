import express from "express";

import {
    spaceOwnerSignIn,
    refreshToken,
    spaceUserSignUp,
    spaceOwnerSignUp,
} from "../../controllers/userCtrls/authController.js"

const router = express.Router();

// space users
router
.route('/su-register')
.post(spaceUserSignUp)

router
.route('/su-sign-in')
.post(spaceOwnerSignIn)

// Space Owners
router
.route('/so-register')
.post(spaceOwnerSignUp)

router
.route('/so-sign-in')
.post(spaceOwnerSignIn)

router
.route('/refresh')
.post(refreshToken)




export default router;
