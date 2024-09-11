import asyncHandler from "../middleware/asyncHandler.js";
import Listing from "../models/listingModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import cloudinaryConfig from "../uploadUtils/cloudinaryConfig.js";

                                                                        // Cloudinary upload for pictures videos and voicenotes
                                                                        
const uploadMessageMediaToCloudinary = async (items) => {
  return Promise.all(items.map(async (item) => {
    if (typeof item === 'string' && item.startsWith('http')) {
     
      return { secure_url: item, public_id: null };
    } else {
      
      const result = await cloudinaryConfig.uploader.upload(item.path, {
        folder: 'ourSpace/message-media',
      });
      return {
        secure_url: result.secure_url,
        public_id: result.public_id
      };
    }
  }));
};
// Voice notes
const uploadVoiceNoteToCloudinary = async (voiceNote) => {
  const result = await cloudinaryConfig.uploader.upload(voiceNote.path, {
    folder: 'ourSpace/voice-notes',
    resource_type: 'video', // Cloudinary treats audio files as video
  });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
};

const sendMessage = asyncHandler(async (req, res) => {
  console.log("Sending a new message".yellow);

  try {
    const sender = req.user;
    const { listing, content, receiver } = req.body;

    const receiverUser = await User.findById(receiver);
    const propertyListing = listing ? await Listing.findById(listing) : null;

    if (!receiverUser) {
      console.log("Invalid receiver");
      return res.status(400).json({ message: 'Invalid receiver' });
    }

    let messageMedia = [];
    let voiceNoteUrl = null;

    const voiceNoteFile = req.files.voiceNote;

    if(voiceNoteFile) {
      voiceNoteUrl = await uploadVoiceNoteToCloudinary(voiceNoteFile)
      console.log("Voice note successfully uploaded to cloudinary")
    }

    // Handle media upload
    if (req.files) {
      console.log("Processing uploaded files");
      messageMedia = await uploadMessageMediaToCloudinary(req.files);
      console.log("Medias uploaded to Cloudinary".cyan);
    } else {
      console.log("No media file uploaded");
      return res.status(400).json({
        message: "No media file uploaded"
      });
    }

    // Create and save the message
    const newMessage = new Message({
      sender: sender._id,
      receiver: receiverUser._id,
      listing: propertyListing ? propertyListing._id : null,
      content,
      messageMedia,
    });
    await newMessage.save();

    // Emit the new message event to the receiver using Socket.IO
    req.io.to(receiverUser._id.toString()).emit('new_message', newMessage);

    console.log("Message sent".magenta);
    res.status(201).json({
      success: true,
      message: "Message successfully sent",
      data: {
        newMessage
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: error.message });
  }
});

const getMessages = asyncHandler(async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Find messages where the current user is either the sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    })
    .populate('sender', 'firstName lastName profilePic')
    .populate('receiver', 'firstName lastName profilePic')
    .sort('timestamp');

    if (!messages.length) {
      return res.status(404).json({ success: false, message: 'No messages found at the moment' });
    }

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      total: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ success: false, message: 'Error retrieving messages', error });
  }
});


export { sendMessage, getMessages };