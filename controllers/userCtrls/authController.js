import User from "../../models/userModel.js";
import jwt from 'jsonwebtoken';
import db from "../../config/db.js"
import asyncHandler from "../../middleware/asyncHandler.js";
import validator from "validator";
import generateTokens from "../../utils/generateTokens.js";
import passport from "passport";
import OTP from "../../models/otpModel.js";
import { generateOTP, saveOTPToDatabase, sendOTPByEmail, verifyOTP } from "../../utils/authUtils.js"

const authenticateToken = asyncHandler(async(req, res)=> {

    console.log("Toekn authentication endpoint".grey)

    const token = req.cookies.accessToken;

    if (!token) {
        console.log("No token provided".red)
        return res.sendStatus(403); // Forbidden
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Error",err.message)
            return res.sendStatus(403); // Forbidden
        }

        console.log("Token verified successfully".magenta)
        req.user = user;
        next();
    });
})

const joinWaitlist = asyncHandler(async (req, res) => {
    console.log("Join waitlist endpoint")
});

const refreshToken = asyncHandler(async(req, res) => {
    console.log("Refreshing token".grey);

    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        console.log("Invalid refresh token".red);
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Error", err.message);
            return res.sendStatus(403); // Forbidden
        }

        const newAccessToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.USER_ACCESS_TOKEN_EXPIRATION_TIME // e.g., 15 minutes
        });

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        console.log("New access token successfully issued".magenta);
        res.json({ accessToken: newAccessToken });
    });
});

//                                                                   SPACE USER
const spaceUserSignUp = asyncHandler(async (req, res) => {
    console.log("Registering new space-user".yellow);
    try {
        // Destructure and trim input fields
        let {
            firstName = '',
            lastName = '',
            email = '',
            password = '',
            phoneNumber = '',
            agreeToTerms
        } = req.body;

        // Trim input fields
        firstName = firstName.replace(/\s+/g, ' ').trim();
        lastName = lastName.replace(/\s+/g, ' ').trim();
        email = email.trim()?.toLowerCase();
        password = password.trim();
        phoneNumber = phoneNumber.trim();

        // Sanitize inputs to prevent XSS
        firstName = validator.escape(firstName);
        lastName = validator.escape(lastName);
        email = validator.escape(email);
        password = validator.escape(password);
        phoneNumber = validator.escape(phoneNumber);

        // Check for required fields
        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            console.log('All fields are required'.red);
            return res.status(400).json({ 
                success: false,
                message: "All fields are required"
            });
        }

        if (agreeToTerms !== true) {
            console.log('You must agree to terms and conditions before creating an account'.red);
            return res.status(400).json({ 
                success: false,
                message: "You must agree to terms and conditions before creating an account"
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            console.log('Invalid email format'.red);
            return res.status(400).json({ 
                success: false,
                message: "Invalid email format"
            });
        }

        // Check for existing user by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Space-user registration failed, user already exists".red);
            return res.status(400).json({ 
                success: false,
                message: "Space-user registration failed, user already exists"
            });
        }

        // Create and save new user
        const user = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            agreeToTerms,
            userType: "space-user"
        });
        await user.save();

        // Find the newly created user by email
        const newUser = await User.findOne({ email });
        if (newUser) {
            const userId = newUser._id;

            // Check if an OTP exists for the user and delete if found
            const existingOtp = await OTP.findOneAndDelete({ user: userId });

            if (existingOtp) {
                console.log("Existing OTP found and deleted:".red);
            }

            // Generate and save a new OTP
            const { otp, hashedOTP } = await generateOTP();
            console.log(`OTP ${otp} generated...`.magenta);
            
            await saveOTPToDatabase(userId, otp, hashedOTP);
            await sendOTPByEmail(email, otp);
            console.log(`OTP successfully sent to ${email}`);
            
            return res.json({
                success: true,
                message: `Enter the OTP sent to ${email}, code expires in 3 minutes`
            });
        }

        console.log("New space-user successfully created".magenta);
        res.status(201).json({
            success: true,
            message: "You've successfully registered as a new space user!",
            data: {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                userType: newUser.userType,
                isEmailVerified: newUser.isEmailVerified
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

///                                                                  SPACE OWNER
const spaceOwnerSignUp = asyncHandler(async (req, res) => {
    console.log("Registering new space-owner".yellow);
    try {
        // Destructure and trim input fields
        let {
            firstName = '',
            lastName = '',
            email = '',
            password = '',
            phoneNumber = '',
            agreeToTerms
        } = req.body;

        // Trim input fields
        firstName = firstName.replace(/\s+/g, ' ').trim();
        lastName = lastName.replace(/\s+/g, ' ').trim();
        email = email.trim()?.toLowerCase();
        password = password.trim();
        phoneNumber = phoneNumber.trim();

        // Sanitize inputs to prevent XSS
        firstName = validator.escape(firstName);
        lastName = validator.escape(lastName);
        email = validator.escape(email);
        password = validator.escape(password);
        phoneNumber = validator.escape(phoneNumber);

        // Check for required fields
        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            console.log('All fields are required'.red);
            return res.status(400).json({ 
                success: false,
                message: "All fields are required"
            });
        }

        if (agreeToTerms !== true) {
            console.log('You must agree to terms and conditions before creating an account'.red);
            return res.status(400).json({ 
                success: false,
                message: "You must agree to terms and conditions before creating an account"
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            console.log('Invalid email format'.red);
            return res.status(400).json({ 
                success: false,
                message: "Invalid email format"
            });
        }

        // Check for existing user by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Space-owner registration failed, user already exists".red);
            return res.status(400).json({ 
                success: false,
                message: "Space-owner registration failed, user already exists"
            });
        }

        // Create and save new user
        const user = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            agreeToTerms,
            userType: "space-owner"
        });
        await user.save();

        // Find the newly created user by email
        const newUser = await User.findOne({ email });
        if (newUser) {
            const userId = newUser._id;

            // Check if an OTP exists for the user and delete if found
            const existingOtp = await OTP.findOneAndDelete({ user: userId });

            if (existingOtp) {
                console.log("Existing OTP found and deleted:".red);
            }

            // Generate and save a new OTP
            const { otp, hashedOTP } = await generateOTP();
            console.log(`OTP ${otp} generated...`.magenta);
            
            await saveOTPToDatabase(userId, otp, hashedOTP);
            await sendOTPByEmail(email, otp);
            console.log(`OTP successfully sent to ${email}`);
            
            return res.json({
                success: true,
                message: `Enter the OTP sent to ${email}, code expires in 3 minutes`
            });
        }

        console.log("New space-owner successfully created".magenta);
        res.status(201).json({
            success: true,
            message: "You've successfully registered as a new space owner!",
            data: {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                userType: newUser.userType,
                isEmailVerified: newUser.isEmailVerified
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const generateOtp = asyncHandler(async (req, res) => {

    try {
      console.log("......")
      console.log("Generating otp...".blue)
      const { email } = req.body;
  

      const user = await User.findOne({ email });
      if(user) {
        const userId = user._id;
  
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
            message: `Enter the OTP sent to ${email}, code expires in 3 minutes`,
          });
      }
      }catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
      }
  
});

const verifyOtp = asyncHandler(async (req, res) => {
    try {
        console.log("Verifying OTP".blue);
  
        const { email, otp } = req.body;
  
        const user = await User.findOne({ email });
  
        if (user) {
            const isOTPValid = await verifyOTP(user._id, otp);
  
            if (isOTPValid) {
                // Set isEmailVerified to true
                user.isEmailVerified = true;
                
                // Save the updated user document
                await user.save();
  
                // Generate JWT tokens for the user
                const { accessToken, refreshToken } = generateTokens(res, user._id);
  
                // Exclude password from the response
                const userResponse = user.toObject();
                delete userResponse.password;
  
                res.json({
                    success: true,
                    message: "OTP verified. You've been successfully logged in.",
                    accessToken,
                    refreshToken,
                    data: userResponse
                });
            } else {
                console.log("Invalid OTP".red);
                return res.status(400).json({
                    success: false,
                    message: "Invalid OTP"
                });
            }
        } else {
            res.status(401);
            throw new Error("Invalid user");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});


const suLogin = asyncHandler(async (req, res) => {
    try {
        console.log("Space user log in endpoint...".blue);

        const { email, password } = req.body

        // Check for required fields
        if (!email || !password) {
            console.log('Email and password are required'.red);
            return res.status(401).json({ 
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by sanitized and normalized email
        const user = await User.findOne({ email });
        console.log("Email:", email);

        // Check if user exists and the password matches
        if (user && (await user.matchPassword(password))) {
            const userId = user._id;
            console.log("UserId:", userId);

            // Generate a JWT token
            const { accessToken, refreshToken } = generateTokens(res, user._id);

            console.log(`Welcome back ${user.firstName}, you're successfully logged in`.magenta);
            res.status(201).json({
                accessToken: accessToken,
                refreshToken: refreshToken,
                success : true,
                message : `Welcome back ${user.firstName}, you're successfully logged in`,
                data : user,
            })
        } else {
            console.log("Invalid email or password".red);
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `Server error: ${error.message}.` });
    }
});

const soLogin = asyncHandler(async (req, res) => {
    try {
        console.log("Space owner log in endpoint...".blue);

        const { email, password } = req.body

        // Check for required fields
        if (!email || !password) {
            console.log('Email and password are required'.red);
            return res.status(401).json({ 
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by sanitized and normalized email
        const user = await User.findOne({ email });
        console.log("Email:", email);

        // Check if user exists and the password matches
        if (user && (await user.matchPassword(password))) {
            const userId = user._id;
            console.log("UserId:", userId);

            // Generate a JWT token
            const { accessToken, refreshToken } = generateTokens(res, user._id);

            console.log(`Welcome back ${user.firstName}, you're successfully logged in`.magenta);
            res.status(201).json({
                accessToken: accessToken,
                refreshToken: refreshToken,
                success : true,
                message : `Welcome back ${user.firstName}, you're successfully logged in`,
                data : user,
            })
        } else {
            console.log("Invalid email or password".red);
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: `Server error: ${error.message}.` });
    }
});
  
// Controller to handle Google authentication
const continueWithGoogle = asyncHandler((req, res, next) => {
    console.log("Sign in / Register with google authenticated".blue)
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
  
  // Controller to handle Google callback and user creation or login
const googleCallback = asyncHandler((req, res) => {
    console.log("Entering google callback route".yellow)
    passport.authenticate('google', { failureRedirect: '/login', session: false }, async (err, user, info) => {
      if (err || !user) {
        console.log("Error", err)
        return res.status(401).json({ 
            success: false,
            message: 'Authentication failed'
         });
      }

      const userId = user._id;
  
      // Generate JWT for the user
      const {accessToken, refreshToken } = generateTokens(res, userId)
  
      // Send the JWT to the frontend
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
  
      console.log("User authenticated successfully".america)
      res.status(200).json({
        success: true,
        message: 'User authenticated successfully',
        accessToken: accessToken,
        refreshToken: refreshToken,
        data: user
      });
    })(req, res);
});

export {
    authenticateToken,
    refreshToken,
    spaceUserSignUp,
    spaceOwnerSignUp,
    generateOtp,
    verifyOtp,
    soLogin,
    suLogin,
    continueWithGoogle,
    googleCallback,
    joinWaitlist
}