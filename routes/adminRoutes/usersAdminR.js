import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { 
    deleteUserAccount,
    editProfileInfo,
    editUserAccountStatus,
    getAllUsers,
    getUserById
 } from "../../controllers/adminCtrls/usersAdminC.js";

const router = express.Router()

router
.route("/all")
.get(protect, getAllUsers) 

router
.route("/:id")
.get(protect, admin, getUserById)

router
.route("/edit-account-status/:id")
.put(protect, admin, editUserAccountStatus)

router
.route("/edit-user-profile/:id")
.put(protect, admin, editProfileInfo)

router
.route("/delete-user-account/:id")
.delete(protect, admin, deleteUserAccount)

export default router

 