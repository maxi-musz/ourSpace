import validator from "validator";
import asyncHandler from "../middleware/asyncHandler.js";
import Waitlist from "../models/waitlistModel.js";
import sendEmail from "../utils/sendMail.js";
import generateCSV from "../utils/generateCsv.js";

const joinwWaitList = asyncHandler(async(req, res) => {
    console.log("Join waitlist endpoint".yellow)

    try {
        

        // Destructure and trim input fields
        let {
            name = '',
            email = '',
            spaceLocation = "",
            phoneNumber = '',
        } = req.body;

        // I Trim input fields
        name = name.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        email = email.trim()?.toLowerCase(); // Trim and normalize email
        spaceLocation = spaceLocation.trim();
        phoneNumber = phoneNumber.trim();

        // I sanitized inputs to prevent XSS
        name = validator.escape(name);
        email = validator.escape(email);
        spaceLocation = validator.escape(spaceLocation);
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
        });
        await waitlistUser.save();

        const newWaitlistUser = await Waitlist.findOne({ email })

        const ourspaceEmail = process.env.OUR_SPACE_EMAIL

        const waitlist = await Waitlist.find({});
        const totalWaitlist = waitlist.length

        // send notification mail to our space
        const waitlistRegisterNotificationEmail = `${ourspaceEmail}, ourspacegloballtd@gmail.com, omayowagold@gmail.com`;
        await sendEmail(
            waitlistRegisterNotificationEmail,
            `Waitlist-New-User joined - Total:${totalWaitlist}`,
            `Find below details of the new user who joined waitlist:
            Name: ${newWaitlistUser.name}
            Email: ${newWaitlistUser.email}
            Phone Number: ${newWaitlistUser.phoneNumber}
            Space Location: ${newWaitlistUser.spaceLocation}`
        );

        // Send mail to user also
        await sendEmail(
            email,
            `Our Space waitlist Successful Registration`,
            `Thanks for joining our waitlist, we will be in touch with you shortly, Cheers to making more money:
            Name: ${newWaitlistUser.name}
            Email: ${newWaitlistUser.email}
            Phone Number: ${newWaitlistUser.phoneNumber}
            Space Location: ${newWaitlistUser.spaceLocation}`
        );

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

const getWaitlists = asyncHandler(async(req, res) => {

    console.log("Getting all waitlist users and sending to Ourspace email as doc".blue)

    const email = "bernardmayowaa@gmail.com"

    try {
        const waitlist = await Waitlist.find({});
        const totalWaitlist = waitlist.length
        console.log(`Total waitlists found: ${totalWaitlist}`)

        if (!waitlist.length) {
            console.log("NO waitlist data found".red)
            res.status(404).json({ 
                success: false,
                message: 'No waitlist entries found'
            });
            return;
        }

        // Generate the CSV content
        const csvContent = generateCSV(waitlist);

        // Send the CSV file via email
        const recipientEmail = `${ourspaceEmail}, ourspacegloballtd@gmail.com, omayowagold@gmail.com`;
        await sendEmail(
        recipientEmail, 
        `Waitlist-CSV -${totalWaitlist}`, // Email subject
        'Please find attached the waitlist CSV file generated every 12 hours.', // Email body text
        [
            {
                filename: 'waitlist.csv',
                content: csvContent,
                contentType: 'text/csv'
            }
        ]
    );

        console.log(`Waitlist data sent to ${email}`.magenta)
        return {
            success: true,
            total: totalWaitlist,
            message: `Waitlist csv data successfully sent to ${email}`
        };
    } catch (error) {
        console.log('Error', error.message)
        res.status(500).json({ message: error.message });
    }
})

// Express route handler
const getWaitlistsRouteHandler = asyncHandler(async (req, res) => {
    try {
        const result = await getWaitlists();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export {
    joinwWaitList,
    getWaitlists,
    getWaitlistsRouteHandler
}

