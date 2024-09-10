import mongoose from "mongoose";

const SmsOtpSchema = new mongoose.Schema({
    user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },

  otp: { type: Number },

  createdAt: { type: Date },

  expiresAt: { type: Date }
})

const SMSOTP = mongoose.model('SMSOTP', SmsOtpSchema);

export default SMSOTP;