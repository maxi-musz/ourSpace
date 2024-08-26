import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { 
    getAllUsers
 } from "../../controllers/adminCtrls/usersAdminC.js";

const router = express.Router()

router
.route("/all")
.get(protect, getAllUsers) 

export default router

 