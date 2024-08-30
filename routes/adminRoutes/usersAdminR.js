import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { 
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

export default router

 