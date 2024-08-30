import validator from "validator";
import asyncHandler from "../../middleware/asyncHandler.js";
import Waitlist from "../../models/waitlistModel.js";
import sendEmail from "../../utils/sendMail.js";
import generateCSV from "../../utils/generateCsv.js";
import Newsletter from "../../models/newsletterModel.js";

const joinwWaitList = asyncHandler(async(req, res) => {
    console.log("Space owners join waitlist endpoint".yellow)

    try {
        
        // Destructure and trim input fields
        let {
            name = '',
            email = '',
            phoneNumber = '',
            type = "",
            spaceLocation = "",
            location = "",
        } = req.body;

        // I Trim input fields
        name = name.replace(/\s+/g, ' ').trim(); // Normalize whitespace to a single space
        email = email.trim()?.toLowerCase(); // Trim and normalize email
        phoneNumber = phoneNumber.trim();
        spaceLocation = spaceLocation.trim();
        type = type.trim();

        // I sanitized inputs to prevent XSS
        name = validator.escape(name);
        email = validator.escape(email);
        phoneNumber = validator.escape(phoneNumber);
        spaceLocation = validator.escape(spaceLocation);
        type = validator.escape(type);

        // Check for required fields
        if (!name || !email ||!phoneNumber ||!type) {
            console.log('Name, email and phone number and type are all required'.red);
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

        const ourspaceEmail = process.env.OUR_SPACE_EMAIL

        // All waitlist
        const totalWaitlist = await Waitlist.find()
        console.log(`Total waitlist regsitrations: ${totalWaitlist.length}`)

        // space owners
        const spaceOwners = await Waitlist.find({ type: "space-owner"});
        const totalSpaceOwners = spaceOwners.length
        console.log(`Total space owners: ${totalSpaceOwners}`)
        // Space users
        const spaceUsers = await Waitlist.find({ type: "space-user"});
        const totalSpaceUsers = spaceUsers.length
        console.log(`Total space users: ${totalSpaceUsers}`)

        const waitlistRegisterNotificationEmail = `${ourspaceEmail}, ourspacegloballtd@gmail.com, omayowagold@gmail.com`;
        // send notification mail to our space
        if(type === "space-user") {
            await sendEmail(
                waitlistRegisterNotificationEmail,
                `Waitlist-New-Space-user joined-Total:${totalSpaceUsers}`,
                `Find below details of the new space user who joined waitlist.\nTotal waitlist space users: ${totalSpaceUsers}.\nTotal waitlist registrations: ${totalWaitlist}:
                Name: ${newWaitlistUser.name}
                Email: ${newWaitlistUser.email}
                Phone Number: ${newWaitlistUser.phoneNumber}
                Location: ${newWaitlistUser.location}`
            );
    
            // Send mail to user also
            await sendEmail(
                email,
                `Our Space waitlist Successful Registration`,
                `Thanks for joining our waitlist, we will be in touch with you shortly
                Name: ${newWaitlistUser.name}
                Email: ${newWaitlistUser.email}
                Phone Number: ${newWaitlistUser.phoneNumber}
                Location: ${newWaitlistUser.location}`
            );
        }

        if(type === "space-owner") {
            await sendEmail(
                waitlistRegisterNotificationEmail,
                `Waitlist-New-Space-owner joined-Total:${totalSpaceOwners}`,
                `Find below details of the new space owner who joined the waitlist.\n
                Total waitlist space owner: ${totalSpaceOwners}.\nTotal waitlist subscribers: ${totalWaitlist.length}:
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
        }
        
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

        const ourspaceEmail = process.env.OUR_SPACE_EMAIL

        // space owners
        const spaceOwners = await Waitlist.find({ type: "space-owner"});
        const totalSpaceOwners = spaceOwners.length
        // Space users
        const spaceUsers = await Waitlist.find({ type: "space-user"});
        const totalSpaceUsers = spaceUsers.length

        // Send the CSV file via email
        const recipientEmail = `${ourspaceEmail}, ourspacegloballtd@gmail.com, omayowagold@gmail.com`;
        await sendEmail(
        recipientEmail, 
        `Waitlist-CSV -${totalWaitlist}`, // Email subject
        `Please find attached the waitlist CSV file generated every 24 hours.\nTotal space users: ${totalSpaceUsers}\nTotal space owners: ${totalSpaceOwners}\nTotal waitlist subscribers: ${totalWaitlist}`, // Email body text
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

const joinNewsletter = asyncHandler(async (req, res) => {
    console.log("Newsletter sign-up endpoint...".blue);

    const { email } = req.body;

    // Check for required fields
    if (!email) {
        console.log('Email is required'.red);
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    // Validate email
    if (!validator.isEmail(email)) {
        console.log('Invalid email format'.red);
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    try {
        //Check if the email is already subscribed (if applicable)
        const existingSubscriber = await Newsletter.findOne({ email });
        if (existingSubscriber) {
            console.log('Email is already subscribed'.yellow);
            return res.status(400).json({
                success: false,
                message: "Email is already subscribed"
            });
        }

        const subscriber = new Newsletter({
            email
        })
        await subscriber.save()

        console.log('Newsletter sign-up successful'.green);
        console.log(`Subscribed Email: ${email}`);

        // Respond with success message
        res.status(200).json({
            success: true,
            message: "Thank you for subscribing to our newsletter!"
        });
    } catch (error) {
        console.error("Error during newsletter sign-up", error.message.red);
        res.status(500).json({
            success: false,
            message: `Server error: ${error.message}`
        });
    }
});

export {
    joinwWaitList,
    getWaitlists,
    getWaitlistsRouteHandler,
    joinNewsletter
}

