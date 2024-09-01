import asyncHandler from "../../middleware/asyncHandler.js";
import User from "../../models/userModel.js";
import cloudinaryConfig from "../../uploadUtils/cloudinaryConfig.js";

// import twilio from 'twilio';

// Twilio configuration
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// const client = twilio(accountSid, authToken);

// Function to generate a random OTP
// const generateOtp = () => {
//     return crypto.randomInt(100000, 999999).toString(); // Generates a 6-digit OTP
// };

// Function to send OTP
const sendSmsOtp = async (phoneNumber) => {
    try {
        const otp = generateOtp();
        const message = `Your OTP code is ${otp}. Please use this code to verify your phone number.`;

        // Send SMS via Twilio
        await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: phoneNumber,
        });

        // Return the OTP for further processing (e.g., saving it to a database)
        return otp;
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new Error("Failed to send OTP.");
    }
};

// const sendSmsVerificationOtp = asyncHandler(async(req, res) =>{
//     console.log("Sending sms verification otp".yellow)

//     const { phoneNumber } = req.body;

//     if (!phoneNumber) {
//         return res.status(400).json({ success: false, message: "Phone number is required" });
//     }

//     try {
//         // Call the function to send OTP
//         const otp = await sendSmsOtp(phoneNumber);

//         res.status(200).json({ success: true, message: "OTP sent successfully", otp });
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Failed to send OTP" });
//     }
// })

// const verifyOtpSms = asyncHandler(async(req, res)=> {
//     console.log("Verifying phone number with sms")

//     const { phoneNumber, otp } = req.body;

//     if (!phoneNumber || !otp) {
//         return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
//     }

//     const validOtp = "123456"; // Replace this with actual OTP validation

//     if (otp === validOtp) {
//         // OTP is valid
//         res.status(200).json({ success: true, message: "Phone number verified successfully" });
//     } else {
//         // OTP is invalid
//         res.status(400).json({ success: false, message: "Invalid OTP" });
//     }
// })

const uploadProfileImageToCloudinary = async (file) => {
    try {
      if (typeof file === 'string' && file.startsWith('http')) {
        // The file is an existing URL, return it as is
        return file;
      } else {
        // The file is a file object, upload it to Cloudinary
        const result = await cloudinaryConfig.uploader.upload(file.path, {
          folder: 'ourSpace/profile-pictures', // Adjust the folder for profile pictures
        });
        return result.secure_url; 
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw new Error('Failed to upload profile picture');
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


export {
    editProfileInfo,
    // sendSmsVerificationOtp,
    // verifyOtpSms
}