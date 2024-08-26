import asyncHandler from "../../middleware/asyncHandler.js"
import User from "../../models/userModel.js"

const getAllUsers = asyncHandler(async(req, res) => {
    console.log("Getting user details...".yellow)
    try{
        const users = await User.find()
        console.log("All users successfully retrieved".america)
        res.status(200).json({
            success : true,
            message : "All users successfully retrieved",
            total: users.length,
            data : users
        })

    }catch(err){
        console.log(`Error retrieving users: ${err.message}`)
        res.status(400).json({
            message : `Error getting users: ${err.message || err}`,
        })
    }
})

export {
    getAllUsers,
}