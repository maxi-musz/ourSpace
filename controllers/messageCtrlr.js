import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
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
    resource_type: 'video',
  });
  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
};

//                                                                            get all messages
const getAllMessages = asyncHandler(async (req, res) => {
  console.log("Getting all messages".yellow)
  try {
    const currentUserId = req.user._id; // Assuming the current logged-in user

    // Find all messages for the current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .populate('sender', 'firstName lastName profilePic')
      .populate('receiver', 'firstName lastName profilePic')
      .populate('listing', 'propertyName bedroomPictures')
      .sort({ timestamp: -1 }); // Sort by the latest message first

    // Group messages by listing and other user (either sender or receiver)
    const groupedMessages = {};
    
    messages.forEach((message) => {
      const otherUserId = message.sender._id.equals(currentUserId)
        ? message.receiver._id
        : message.sender._id;

      const listingId = message.listing ? message.listing._id.toString() : 'no_listing';

      // Create a unique key for the combination of listing and other user
      const key = `${otherUserId}-${listingId}`;

      if (!groupedMessages[key]) {
        groupedMessages[key] = {
          propertyOwner: {
            id: message.sender._id,
            name: `${message.sender.firstName} ${message.sender.lastName}`,
            profilePic: message.sender.profilePic.secure_url,
          },
          propertyUser: {
            id: currentUserId,
            name: `${message.receiver.firstName} ${message.receiver.lastName}`,
            profilePic: message.receiver.profilePic.secure_url,
          },
          property: message.listing
            ? {
                id: message.listing._id,
                name: message.listing.propertyName,
                image: message.listing.bedroomPictures?.[0]?.secure_url || null,
              }
            : null,
          lastMessageContent: message.content,
          lastMessageTimestamp: message.timestamp,
          unreadCount: 0, // We'll count unread messages below
        };
      }

      // Count unread messages for the current user
      if (!message.isRead && message.receiver._id.equals(currentUserId)) {
        groupedMessages[key].unreadCount += 1;
      }
    });

    const messageThreads = Object.values(groupedMessages);

    if (messageThreads.length === 0) {
      console.log("No messages found at the moment".red)
      return res.status(200).json({
        success: true,
        message: 'No messages found',
        data: [],
      });
    }

    // Return the list of chat threads
    console.log("Messages retrived successfully".magenta)
    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      total: messageThreads.length,
      data: messageThreads,
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ success: false, message: 'Error retrieving messages', error });
  }
});

const getMessagesForAListing = asyncHandler(async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { listingId, otherUserId } = req.body;

    // Find all messages between the current user and the other user for a specific listing
    const messages = await Message.find({
      $and: [
        { listing: listingId }, // Messages related to the listing
        {
          $or: [
            { sender: currentUserId, receiver: otherUserId }, // Current user is the sender
            { sender: otherUserId, receiver: currentUserId }, // Current user is the receiver
          ],
        },
      ],
    })
      .sort({ timestamp: 1 }) // Sort by timestamp (oldest to newest)
      .populate('sender', 'profilePic') // Populate the sender's profilePic
      .exec();

    if (!messages || messages.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No messages found for this listing',
        data: [],
      });
    }

    // Return only the messages content, timestamp, and media
    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully for the listing',
      total: messages.length,
      data: messages.map(message => ({
        displayImage: message.sender.profilePic,
        content: message.content,
        sender: message.sender,
        timestamp: message.timestamp,
        messageMedia: message.messageMedia, // Include media if any
      })),
    });
  } catch (error) {
    console.error('Error retrieving messages for the listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving messages for the listing',
      error: error.message,
    });
  }
});


//                                                                            send message
const sendMessage = asyncHandler(async (req, res) => {
  console.log("Sending a new message".yellow);

  try {
    const sender = req.user;
    const { listingId, content, receiver } = req.body;

    const receiverUser = await User.findById(receiver);
    const propertyListing = await Listing.findById(listingId);

    if(!propertyListing) {
      console.log("Listing not found".red)
      return res.status(400).json({
        success: false,
        message: "This listing isn't available again or has been deleted by owner"
      })
    }

    if (!receiverUser) {
      console.log("Invalid receiver");
      return res.status(400).json({ message: 'User does not exist or account hasa been suspended or deleted' });
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
      listing: propertyListing._id,
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



export { 
  sendMessage, 
  getAllMessages,
  getMessagesForAListing
};