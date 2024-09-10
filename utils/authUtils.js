import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import otpGenerator from "otp-generator"; 
import OTP from '../models/otpModel.js';
import { isAfter } from 'date-fns';
import { OTPExpiredError } from './otpErrors.js';
import { passwordResetEmailTemplate } from '../email_templates/passwordResetEmailTemplate.js';
import { otpVerificationCodeTemplate } from '../email_templates/otpVerificationCodeTemplate.js';

const hashFunction = async (data) => {
  const saltRounds = 10; // Salt rounds for bcrypt
  return bcrypt.hash(data, saltRounds);
};

export const generateOTP = async () => {
  const otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false })

  const hashedOTP = await hashFunction(otp);

  return { otp, hashedOTP };
};

export const saveOTPToDatabase = async (userId,  otp, hashedOTP) => {
  try {
    const newOTP = new OTP({
      user: userId,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 400000, // Expires in 3 minutes (600,000 milliseconds)
    });

    await newOTP.save();
    return otp; // Return the plain OTP for sending via email or other methods
  } catch (error) {
    console.error('Error saving OTP to database:', error);
    throw new Error('Failed to save OTP');
  }
};

export const sendOTPByEmail = async (email,otp) => {
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const otpExpiresAt = "3 minutes"
    const htmlContent = otpVerificationCodeTemplate(email, otp, otpExpiresAt);

    const mailOptions = {
      from: {
        name: "Ourspace",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Login OTP Confirmation Code',
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
};

export const verifyOTP = async (userId, inputOTP) => {
    console.log("Searching for otp".grey)
  try {

    console.log("Finding otp from database...".green);
    const existingOtp = await OTP.findOne({user: userId})
    const hashedOtp = existingOtp.otp
        
        if (hashedOtp) {
            const isMatch = await bcrypt.compare(inputOTP, hashedOtp);
            console.log(`Input OTP: ${inputOTP}, hashed OTP: ${hashedOtp}`.yellow);
            console.log(`isMatch: ${isMatch}`)

            if (isMatch === false) {
                console.log("Invalid OTP entered!!!".red)
                return false;
            } else if(isMatch === true) {
                const updatedUser = await User.findByIdAndUpdate(userId, { isEmailVerified: true });
                updatedUser.save()
                console.log("Valid OTP inserted and isEmailVerified set to true".magenta)
                
                const currentTime = new Date();
                if (isAfter(currentTime, existingOtp.expiresAt)) {
                    console.log("OTP expired".red);
                    return false;
                } else {
                    return true;
                }
            }
        }else {
            return false;
        }
  } catch (error) {
    console.log(error.message.blue);
  }
};


