import asyncHandler from "../../middleware/asyncHandler.js"
import User from "../../models/userModel.js"

const getAllUsers = asyncHandler(async (req, res) => {
    console.log("Getting all users...".yellow);

    // Extract userType from query parameters
    const { userType } = req.query;
    let filter = {};

    // Apply filter if userType is provided
    if (userType) {
        if (["space-user", "space-owner"].includes(userType)) {
            filter.userType = userType;
            console.log(`Filtering users by userType: ${userType}`.cyan);
        } else {
            console.log(`Invalid userType provided: ${userType}`.red);
            return res.status(400).json({
                success: false,
                message: "Invalid userType provided. Must be 'space-user' or 'space-owner'."
            });
        }
    }

    try {
        const users = await User.find(filter);
        console.log("All users successfully retrieved".america);
        res.status(200).json({
            success: true,
            message: "All users successfully retrieved",
            total: users.length,
            data: users
        });

    } catch (err) {
        console.log(`Error retrieving users: ${err.message}`.red);
        res.status(400).json({
            success: false,
            message: `Error getting users: ${err.message || err}`,
        });
    }
});

const getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    console.log(`Getting user with ID ${userId}`.blue);

    const user = await User.findById(userId);
    
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({
        user: user
    });
});

export {
    getAllUsers,
    getUserById
}