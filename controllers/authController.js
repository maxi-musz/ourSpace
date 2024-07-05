import User from "../models/userModel.js";
import db from "../config/db.js"
import asyncHandler from "../middleware/asyncHandler.js";
import validator from "validator";

const registerUser = asyncHandler(async (req, res) => {
    console.log("Registering new user".yellow)
    try {
        // Destructure and trim input fields
        let {
            firstName = '',
            lastName = '',
            email = '',
            password = '',
        } = req.body;

        // Trim input fields
        firstName = firstName.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        lastName = lastName.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        email = email.trim().toLowerCase(); // Trim and normalize email
        password = password.trim();

        // Sanitize inputs to prevent XSS
        firstName = validator.escape(firstName);
        lastName = validator.escape(lastName);
        email = validator.escape(email);
        password = validator.escape(password);

        // Check for required fields
        if (!firstName || !lastName || !email || !password) {
            console.log('All fields are required'.red);
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            console.log('Invalid email format'.red);
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        // Check for existing user by email
        db.connectDb()
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User registration failed, user already exists".red);
            return res.status(400).json({ error: 'Email already in use.' });
        }

        // Create and save new user
        const user = new User({
            firstName,
            lastName,
            email,
            password,
        });
        await user.save();
        db.disconnectDb()

        console.log("User successfully created".magenta);
        res.status(201).json({
            data : user,
            success : true,
            message : "User created Successfully!"
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

const loginUser = asyncHandler(async (req, res) => {
    try {
        console.log("Log in user endpoint...".blue);

        const { email, password } = req.body

        // Check for required fields
        if (!email || !password) {
            console.log('Email and password are required'.red);
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user by sanitized and normalized email
        db.connectDb()
        const user = await User.findOne({ email });
        console.log("Email:", email);

        // Check if user exists and the password matches
        if (user && (await user.matchPassword(password))) {
            const userId = user._id;
            console.log("UserId:", userId);

            // Generate a JWT token
            const token = generateToken(res, userId);

            console.log("User successfully logged in".magenta);
            res.status(201).json({
                jwt: token,
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

const userDetails = asyncHandler(async(req, res) => {
    console.log("Getting user details...")
    try{
        const user = await userModel.findById(req.userId)
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
    registerUser,
    loginUser,
    userDetails
}