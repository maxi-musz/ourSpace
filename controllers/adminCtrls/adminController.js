import asyncHandler from "../../middleware/asyncHandler.js"
import User from "../../models/userModel.js"


const userDetails = asyncHandler(async(req, res) => {
    console.log("Getting user details...")
    try{
        const user = await User.findById(req.userId)
        console.log("User details successfully retrieved".blue)
        res.status(200).json({
            success : true,
            message : "User details retrieved",
            data : user
        })

    }catch(err){
        console.log(`Error retrieving user details: ${err.message}`)
        res.status(400).json({
            message : `Error getting user details: ${err.message || err}`,
        })
    }
})

export {
    userDetails,
}