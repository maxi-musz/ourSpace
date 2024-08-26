import User from "../../models/userModel.js";
import jwt from 'jsonwebtoken';
import db from "../../config/db.js"
import asyncHandler from "../../middleware/asyncHandler.js";
import validator from "validator";
import generateTokens from "../../utils/generateTokens.js";

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

const spaceUserSignUp = asyncHandler(async (req, res) => {
    console.log("Registering new space-user".yellow)
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
        firstName = firstName.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        lastName = lastName.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        email = email.trim()?.toLowerCase(); // Trim and normalize email
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

        if(agreeToTerms !== true) {
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
        db.disconnectDb()

        console.log("new space-user successfully created".magenta);
        res.status(201).json({
            data : user,
            success : true,
            message : "You've successfully registered as a new space user!"
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const spaceOwnerSignUp = asyncHandler(async (req, res) => {
    console.log("Registering new space-owner".yellow)
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
        firstName = firstName.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        lastName = lastName.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        email = email.trim()?.toLowerCase(); // Trim and normalize email
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

        if(agreeToTerms !== true) {
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
            console.log("Space-owner registration failed, email already exists".red);
            return res.status(400).json({ 
                success: false,
                message: "Space-owner registration failed, email already exists"
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
        db.disconnectDb()

        console.log("new space-owner successfully created".magenta);
        res.status(201).json({
            data : user,
            success : true,
            message : "You've successfully registered as a new space owner!, cheers to making more money"
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const spaceOwnerSignIn = asyncHandler(async (req, res) => {
    try {
        console.log("Log in user endpoint...".blue);

        const { email, password } = req.body

        // Check for required fields
        if (!email || !password) {
            console.log('Email and password are required'.red);
            return res.status(400).json({ error: 'Email and password are required.' });
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

            console.log("User successfully logged in".magenta);
            res.status(201).json({
                accessToken: accessToken,
                refreshToken: refreshToken,
                success : true,
                message : "User logged in Successfully!",
                data : user,
            })
        } else {
            console.log("Invalid email or password".red);
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

const joinWaitlist = asyncHandler(async (req, res) => {
    console.log("Join waitlist endpoint")
});

export {
    authenticateToken,
    refreshToken,
    spaceUserSignUp,
    spaceOwnerSignUp,
    spaceOwnerSignIn,
    joinWaitlist
}