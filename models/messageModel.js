// models/messageModel.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: false, // Make this optional if not all messages are tied to a listing
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false, // Track if the message has been read
  }
}, {
  timestamps: true
});

// Add index for better query performance
messageSchema.index({ sender: 1, receiver: 1, listing: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
