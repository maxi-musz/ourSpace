// utils/sendEmail.js
import nodemailer from 'nodemailer';

import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASSWORD  // your email password
    }
});

const sendEmail = async (to, subject, text, attachments) => {
    try {
        const info = await transporter.sendMail({
            from: {
                name: "OurSpace",
                address: process.env.EMAIL_USER
            }, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            attachments: attachments // array of attachments
        });

        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email: %s", error);
    }
};

export default sendEmail;
