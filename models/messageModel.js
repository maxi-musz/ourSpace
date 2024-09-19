import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  secure_url: { type: String },
  public_id: { type: String }
});

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
    required: true,
  },
  content: {
    type: String,
  },

  messageMedia:[mediaSchema],

  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

messageSchema.index({ sender: 1, receiver: 1, listing: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
