import validator from "validator";
import asyncHandler from "../middleware/asyncHandler.js";
import Waitlist from "../models/waitlistModel.js";

const joinwWaitList = asyncHandler(async(req, res) => {
    console.log("Join waitlist endpoint".yellow)

    try {
        

        // Destructure and trim input fields
        let {
            name = '',
            email = '',
            spaceLocation = "",
            location = "",
            type = "",
            phoneNumber = '',
        } = req.body;

        // I Trim input fields
        name = name.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        email = email.trim().toLowerCase(); // Trim and normalize email
        spaceLocation = spaceLocation.trim();
        location = location.trim();
        type = type.trim();
        phoneNumber = phoneNumber.trim();

        // I sanitized inputs to prevent XSS
        name = validator.escape(name);
        email = validator.escape(email);
        spaceLocation = validator.escape(spaceLocation);
        location = validator.escape(location);
        type = validator.escape(type);
        phoneNumber = validator.escape(phoneNumber);

        // Check for required fields
        if (!name || !email ||!phoneNumber) {
            console.log('Name, email and phone number are all required'.red);
            return res.status(400).json({ error: 'Name, email and phone number are all required.' });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            console.log('Invalid email format'.red);
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        // Check for existing user by email
        
        const existingWaitlistUser = await Waitlist.findOne({ email });
        if (existingWaitlistUser) {
            console.log("Email already in use".red);
            return res.status(400).json({ error: 'Email already in use.' });
        }

        // Create and save new waitlist user
        const waitlistUser = new Waitlist({
            name,
            email,
            phoneNumber,
            spaceLocation,
            location,
            type
        });
        await waitlistUser.save();

        const newWaitlistUser = await Waitlist.findOne({ email })

        console.log("You have successfully joined the waitlist. We will be in touch with you".magenta);
        res.status(201).json({
            success : true,
            message : "You have successfully joined the waitlist. We will be in touch with you!",
            data : newWaitlistUser
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false,
            message: error.message
         });
    }
})

export {
    joinwWaitList
}

