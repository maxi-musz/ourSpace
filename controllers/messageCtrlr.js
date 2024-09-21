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

//                                  get all chats for space owners
const spaceOwnerGetAllChats = async (req) => {
  console.log("Space owner get all chats".yellow)
  try {
    const userId = req.user._id;
    const currentUserId = data.user._id

    console.log(`Current user id: ${currentUserId}\nUserType: ${userType}`)

    if(req.user.userType !== "space-owner") {
      console.log("Only space owners are aloowed".red)
      return res.status(404).json({
        success: false,
        message: "Only space owners are aloowed"
      })
    }

    // Find all messages where the listing belongs to the currently signed-in user
    const messages = await Message.find({
      receiver: userId
    })
    .populate({
      path: 'receiver',
      select: '_id firstName lastName profilePic', // Populate receiver's info
    })
    .populate({
      path: "sender",
      select: "_id firstName lastName profilePic"
    })
    .populate({
      path: 'listing',
      match: { user: userId }, // Ensure the listing belongs to the signed-in user
      select: '_id propertyName bedroomPictures', // Populate listing info
    });

    console.log(`Total of `)

    // Filter out messages without valid listing matches
    const filteredMessages = messages.filter(message => message.listing);

    // Create a map to group messages by listingId
    const groupedMessages = {};
    filteredMessages.forEach((message) => {
      const listingId = message.listing._id.toString();
      if (!groupedMessages[listingId]) {
        // Structure the output
        groupedMessages[listingId] = {
          propertyOwner: {
            id: req.user._id, 
            name: message.receiver.firstName + " " + message.receiver.lastName,
            profilePic: message.receiver.profilePic
          },
          propertyUser: {
            id: message.sender._id,
            name: message.sender.firstName + " " + message.sender.lastName, 
            profilePic: message.sender.profilePic
          },
          property: {
            id: message.listing._id,
            name: message.listing.propertyName,
            image: message.listing.bedroomPictures[0] // First image in bedroomPictures array
          },
          lastMessageContent: message.content,
          lastMessageTimestamp: message.createdAt // Adjust to the field for timestamp
        };
      }
    });

    // Convert the map to an array of messages
    const result = Object.values(groupedMessages);

    console.log("Result of get all chat for space users sent to frontend".green)
    return result

    res.status(200).json({
      success: true,
      message: "All messages retrieved successfully",
      total: result.length,
      data: result
    });
  } catch (error) {
    console.error("Error getting all chats for space owner", error);
    return("Error getting all chats for space owner", error)
  }
};

//                                  get all chats for space users
const spaceUserGetAllChats = async (req) => {
  console.log("Space user get all chats".yellow);
  try {

    const currentUserId = req.user._id;
    const userType = req.user.userType;

    console.log(`Current user id: ${currentUserId}\nUserType: ${userType}`)
  
    if (req.user.userType !== "space-user") {
      console.log("Only space users are allowed".red);
      return res.status(404).json({
        success: false,
        message: "Only space users are allowed"
      });
    }

    // Find all messages where the user is either the sender or the receiver
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
    .populate({
      path: 'receiver',
      select: '_id firstName lastName profilePic', // Populate receiver's info
    })
    .populate({
      path: "sender",
      select: "_id firstName lastName profilePic"
    })
    .populate({
      path: 'listing',
      select: '_id propertyName bedroomPictures user', // Populate listing info, including property owner
      populate: {
        path: 'user', // Populate the property owner
        select: '_id firstName lastName profilePic' // Include these fields from the owner
      }
    });

    // Filter out messages without valid listing matches
    const filteredMessages = messages.filter(message => message.listing);

    // Create a map to group messages by listingId and track unread messages
    const groupedMessages = {};
    filteredMessages.forEach((message) => {
      const listingId = message.listing._id.toString();

      // Count unread messages (for simplicity assuming an `isRead` field)
      const isUnread = message.isRead === false && message.receiver._id.toString() === currentUserId;

      if (!groupedMessages[listingId]) {
        // Structure the output, keeping only the latest message
        groupedMessages[listingId] = {
          propertyOwner: {
            id: message.listing.user._id,
            name: message.listing.user.firstName + " " + message.listing.user.lastName,
            profilePic: message.listing.user.profilePic
          },
          propertyUser: {
            id: req.user._id,
            name: req.user.firstName + " " + req.user.lastName,
            profilePic: req.user.profilePic
          },
          property: {
            id: message.listing._id,
            name: message.listing.propertyName,
            image: message.listing.bedroomPictures[0] // First image in bedroomPictures array
          },
          lastMessageContent: message.content,
          lastMessageTimestamp: message.createdAt,
          unreadCount: isUnread ? 1 : 0
        };
      } else if (isUnread) {
        groupedMessages[listingId].unreadCount += 1;
      }
    });

    // Convert the map to an array of messages
    const result = Object.values(groupedMessages);
    console.log("Result of get all chat for space users sent to frontend".green)
    return result

    // res.status(200).json({
    //   success: true,
    //   message: "Messages retrieved successfully",
    //   total: result.length,
    //   data: result
    // });
  } catch (error) {
    console.error("Error getting all chats for space users", error);
    return ("Error getting all chats for space users", error)
  }
};

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
        senderId: currentUserId,
        displayImage: message.sender.profilePic,
        content: message.content,
        timestamp: message.timestamp,
        messageMedia: message.messageMedia, // Include media if any
      })),
    });
  } catch (error) {
    console.log("Something went wrong", error)
    return ("Something went wrong", error)
  }
});

//                                 send message
const sendMessage = asyncHandler(async (req, res) => {
  console.log("Sending a new message".yellow);

  try {
    const sender = req.user;
    const { listingId, content, receiverId } = req.body;

    const receiverUser = await User.findById(receiverId);
    const propertyListing = await Listing.findById(listingId);

    if (!propertyListing) {
      console.log("Listing not found".red);
      return res.status(400).json({
        success: false,
        message: "This listing isn't available again or has been deleted by owner",
      });
    }

    if (!receiverUser) {
      console.log("Invalid receiver");
      return res.status(400).json({
        message: "User does not exist or account has been suspended or deleted",
      });
    }

    let messageMedia = [];
    let voiceNoteUrl = null;

    const voiceNoteFile = req.files.voiceNote;

    if (voiceNoteFile) {
      voiceNoteUrl = await uploadVoiceNoteToCloudinary(voiceNoteFile);
      console.log("Voice note successfully uploaded to cloudinary");
    }

    // Handle media upload
    if (req.files) {
      console.log("Processing uploaded files");
      messageMedia = await uploadMessageMediaToCloudinary(req.files);
      console.log("Medias uploaded to Cloudinary".cyan);
    } else {
      console.log("No media file uploaded");
      return res.status(400).json({
        message: "No media file uploaded",
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

    // Log all connected rooms
    console.log(req.io.sockets.adapter.rooms);

    // Emit the new message event to the receiver using Socket.IO
    req.io.to(receiverUser._id.toString()).emit('new_message', newMessage);

    console.log("Message sent to user room:", receiverUser._id.toString());
    res.status(201).json({
      success: true,
      message: "Message successfully sent",
      data: {
        newMessage,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: error.message });
  }
});


export { 
  sendMessage, 
  spaceOwnerGetAllChats,
  spaceUserGetAllChats,
  getMessagesForAListing
};

