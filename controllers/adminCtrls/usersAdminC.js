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
        console.log(`Total of ${users.length} users successfully retrieved`.america);
        res.status(200).json({
            success: true,
            message: `Total of ${users.length} users successfully retrieved`,
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
        console.log(`User not retrieved`.red);
        res.status(404).json({
            success: false,
            message: `User not retrieved`,
        });
    }

    console.log(`User successfully retrieved`.america);
    res.status(200).json({
        success: true,
        message: `User successfully retrieved`,
        data: user
    });
});

const editProfileInfo = asyncHandler(async (req, res) => {
    console.log("Editing profile information".yellow);

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const {
            firstName,
            lastName,
            email,
            gender,
            dateOfBirth,
            mobileNumber,
            country,
            state,
            city,
            homeAddress,
            phoneNumber,
        } = req.body;

        // Update fields only if they are provided in the request
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (gender) user.gender = gender;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (mobileNumber) user.mobileNumber = mobileNumber;
        if (country) user.country = country;
        if (state) user.state = state;
        if (city) user.city = city;
        if (homeAddress) user.homeAddress = homeAddress;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        // Handle profile picture upload
        if (req.file) {
            const profilePicUrl = await uploadProfileImageToCloudinary(req.file);
            user.profilePic = profilePicUrl;
        }

        await user.save();

        // Exclude the password field from the user object
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        console.log(`Profile information updated for user ID: ${req.user._id}`.green);
        res.status(200).json({
            success: true,
            message: "Profile information updated successfully",
            user: userWithoutPassword,
        });

    } catch (error) {
        console.error("Error updating profile information:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating profile information",
        });
    }
});

const editUserAccountStatus = asyncHandler(async (req, res) => {
    console.log("Editing user account status".yellow);

    try {
        const userId = req.params.id;
        const { status } = req.body;

        // Define the list of valid statuses
        const validStatuses = ['active', 'inactive', 'suspended', 'blocked'];

        // Check if the provided status is valid
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        // Find the user by ID and update the status
        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true, runValidators: true } // Return the updated document and validate before updating
        );

        if (!user) {
            console.log(`Error updating user`.red);
            res.status(200).json({
                success: true,
                message: `Error updating user`,
            });
        }

        console.log(`User successfully updated`.america);
        res.status(200).json({
            success: true,
            message: `User successfully updated`,
            data: user
        });
    } catch (error) {
        console.error("Error updating user account status:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

const deleteUserAccount = asyncHandler(async (req, res) => {
    console.log("Deleting user account".red);

    try {
        const userId = req.params.id;

        // Find the user by ID and delete the account
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User account deleted successfully",
            user: user // Optional: return the deleted user's data
        });
    } catch (error) {
        console.error("Error deleting user account:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



export {
    getAllUsers,
    getUserById,
    editProfileInfo,
    editUserAccountStatus,
    deleteUserAccount
}