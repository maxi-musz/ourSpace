import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },

  otp: { type: String },

  createdAt: { type: Date },

  expiresAt: { type: Date }
})

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;