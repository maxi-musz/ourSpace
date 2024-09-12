import asyncHandler from "../../middleware/asyncHandler.js";
import User from "../../models/userModel.js";
import cloudinaryConfig from "../../uploadUtils/cloudinaryConfig.js";

const uploadProfileImageToCloudinary = async (file) => {
    try {
        if (typeof file === 'string' && file.startsWith('http')) {
            return { url: file, publicId: null };
        } else {
            const result = await cloudinaryConfig.uploader.upload(file.path, {
                folder: 'ourSpace/profile-pictures',
            });
            return {
                url: result.secure_url,
                publicId: result.public_id
            };
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw new Error('Failed to upload profile picture');
    }
};


// DELETE IMAGES
const deleteImageFromCloudinary = async (publicId) => {
    if (publicId) {
        try {
            const result = await cloudinaryConfig.uploader.destroy(publicId);
            console.log(`Image with public_id ${publicId} deleted:`, result);
            return result;
        } catch (error) {
            console.error(`Error deleting image with public_id ${publicId}:`, error);
            throw error;
        }
    } else {
        console.error("No publicId provided for deletion.");
    }
};


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
        if (mobileNumber) user.mobileNumber = mobileNumber;
        if (gender) user.gender = gender;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (country) user.country = country;
        if (state) user.state = state;
        if (city) user.city = city;
        if (homeAddress) user.homeAddress = homeAddress;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        let removedImage = req.body.removedImage; // Changed to singular

        // Handle profile picture upload
        if (req.file) {
            if (user.profilePic && user.profilePic.publicId && removedImage === user.profilePic.publicId) {
                try {
                    await deleteImageFromCloudinary(removedImage);
                } catch (error) {
                    console.error('Error during image deletion:', error);
                }
            }

            // Upload the new profile picture
            try {
                const profilePicData = await uploadProfileImageToCloudinary(req.file);
                user.profilePic = profilePicData;
            } catch (error) {
                console.error('Error uploading profile picture:', error);
            }
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

export {
    editProfileInfo,
    // sendSmsVerificationOtp,
    // verifyOtpSms
}