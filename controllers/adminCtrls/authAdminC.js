import asyncHandler from "../../middleware/asyncHandler.js"
import OTP from "../../models/otpModel.js";
import User from "../../models/userModel.js"
import { generateOTP, saveOTPToDatabase, sendOTPByEmail, verifyOTP } from "../../utils/authUtils.js";
import generateTokens from "../../utils/generateTokens.js";


const generateOtp = asyncHandler(async (req, res) => {

    try {
      console.log("Generating login otp...".blue)
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (user && (await user.matchPassword(password))) {
        const userId = user._id;


        if(!user.isAdmin) {
            console.log("Only admins are allowed to access this route".red)
            return res.json({
                success: false,
                message: "Only admins are allowed to access this route"
            })
        }
  
        // Check if an OTP exists for the user
        const existingOtp = await OTP.findOneAndDelete({ user: userId });
        if (existingOtp) {
          console.log("Existing OTP found and deleted:".red);
        }
  
        const { otp, hashedOTP } = await generateOTP();
          console.log("......")
          console.log(`Otp ${otp} generated...`.magenta)
    
          await saveOTPToDatabase(userId, otp, hashedOTP);
          await sendOTPByEmail(email, otp);
          console.log(`Otp succeessfully sent to ${email}`)
  
          res.json({
            success: true,
            message: `Enter the OTP sent to ${email}, code expires in 3 minutes`,
          });
      }       else {
        res.status(401);
        throw new Error("Invalid credentials")
      }
      }catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
      }
  
});

const verifyOtp = asyncHandler(async (req, res) => {
    try {
      console.log("......");
      console.log("Verifying OTP".blue);
  
      const { email, otp } = req.body; 
      console.log(otp)
  
      const user = await User.findOne({ email });
  
      if (user) {
  
        const isOTPValid = await verifyOTP(user._id, otp);
  
        if (isOTPValid === true) {
          // Log in the user immediately
          const {accessToken, refreshToken } = generateTokens(res, user._id);
  
          user.lastLogin = Date.now();
          await user.save();
  
          res.json({
            success: true,
            message: "OTP verified and user logged in successfully.",
            accessToken: accessToken,
            refreshToken: refreshToken,
            data: user
          });
          console.log("User successfully logged in")
        } else {
          return res.status(400).json({
            success: false,
            message: "OTP invalid or expired..."
          });
        }
      } else {
        res.status(401);
        throw new Error("Invalid user");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ 
        success: false,
        message: error.message
       });
    }
});

export {
    generateOtp,
    verifyOtp
}