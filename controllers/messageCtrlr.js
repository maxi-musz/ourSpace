import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Listing from "../models/listingModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import cloudinaryConfig from "../uploadUtils/cloudinaryConfig.js";

                                                                        // Cloudinary upload for pictures videos and voicenotes
                                                                        
// const uploadMessageMediaToCloudinary = async (items) => {
//   return Promise.all(items.map(async (item) => {
//     if (typeof item === 'string' && item.startsWith('http')) {
     
//       return { secure_url: item, public_id: null };
//     } else {
      
//       const result = await cloudinaryConfig.uploader.upload(item.path, {
//         folder: 'ourSpace/message-media',
//       });
//       return {
//         secure_url: result.secure_url,
//         public_id: result.public_id
//       };
//     }
//   }));
// };


const uploadMessageMediaToCloudinary = async (items) => {
  return Promise.all(items.map(async (item) => {
    // Check if the item is a URL (if the file is already uploaded)
    if (typeof item === 'string' && item.startsWith('http')) {
      return { secure_url: item, public_id: null };
    } else {
      // Upload to Cloudinary
      const result = await cloudinaryConfig.uploader.upload(`data:image/*;base64,${item}`, {
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

    const currentUserId = req.user._id
    const userType = req.user.userType;

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
      match: { user: currentUserId }, 
      select: '_id propertyName bedroomPictures', 
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
    return {
      success: true,
      message: "All messages retrieved successfully",
      total: result.length,
      data: result
    }

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
      return {
        success: false,
        message: "Only space users are allowed"
      };
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
    return {
        success: true,
        message: "Messages retrieved successfully",
        total: result.length,
        data: result
      }

  } catch (error) {
    console.error("Error getting all chats for space users", error);
    return ("Error getting all chats for space users", error)
  }
};

const getMessagesForAListing = asyncHandler(async (data) => {
  try {
    const {currentUserId, listingId, otherUserId } = data;
    console.log(`current user id: ${currentUserId}\nListingId: ${listingId}\n Other user Id: ${otherUserId}`)

    // Find all messages between the current user and the other user for a specific listing
    const messages = await Message.find({
      $and: [
        { listing: listingId }, // Messages related to the listing
        {
          $or: [
            { sender: currentUserId, receiver: otherUserId }, 
            { sender: otherUserId, receiver: currentUserId },
          ],
        },
      ],
    })
      .sort({ timestamp: 1 }) // Sort by timestamp (oldest to newest)
      .populate('sender', 'profilePic') // Populate the sender's profilePic
      .exec();

    if (!messages || messages.length === 0) {
      return {
        success: true,
        message: 'No messages found for this listing',
        data: [],
      };
    }

    // Return only the messages content, timestamp, and media
    
    return {
      success: true,
      message: 'Messages retrieved successfully for the listing',
      total: messages.length,
      data: messages.map(message => ({
        senderId: message.sender._id,
        displayImage: message.sender.profilePic,
        content: message.content,
        timestamp: message.timestamp,
        messageMedia: message.messageMedia,
      })),
    };
  } catch (error) {
    console.log("Something went wrong", error);
    return { success: false, message: "Something went wrong", error };
  }
});

//                                 send message
const sendMessage = asyncHandler(async (data) => {
  console.log("Sending a new message".yellow);

  try {
    const { sender, listingId, content, receiverId, messageMedia = [], voiceNote } = data;

    // Fetching receiver and listing details
    const receiverUser = await User.findById(receiverId);
    const propertyListing = await Listing.findById(listingId);

    console.log(`listingId: ${listingId}\nsender: ${sender}, receiverId: ${receiverId}`.bgYellow);

    // Validate listing and receiver
    if (!propertyListing) {
      console.log("This listing isn't available again or has been deleted by the owner".bgRed);
      return {
        success: false,
        message: "This listing isn't available again or has been deleted by the owner",
      };
    }

    if (!receiverUser) {
      console.log("User does not exist or account has been suspended or deleted".bgRed);
      return {
        success: false,
        message: "User does not exist or account has been suspended or deleted",
      };
    }

    let uploadedMedia = [];

    // Upload message media if exists
    if (messageMedia.length > 0) {
      console.log("Processing uploaded media files".cyan);
      uploadedMedia = await uploadMessageMediaToCloudinary(messageMedia);
      console.log("Media uploaded to Cloudinary".green);
    }

    let voiceNoteUrl = null;
    if (voiceNote) {
      console.log("Processing voice note file".cyan);
      const voiceNoteResult = await cloudinaryConfig.uploader.upload(`data:audio/*;base64,${voiceNote}`, {
        folder: 'ourSpace/message-voice-notes',
      });
      voiceNoteUrl = voiceNoteResult.secure_url;
      console.log("Voice note uploaded to Cloudinary".green);
    }

    // Create and save the message
    const newMessage = new Message({
      sender: sender._id,
      receiver: receiverUser._id,
      listing: propertyListing._id,
      content,
      messageMedia: uploadedMedia,
      voiceNote: voiceNoteUrl,
    });

    await newMessage.save();

    console.log("Message sent to user room:", receiverUser._id.toString());

    // Create response in the structure needed by the frontend
    const formattedResponse = {
      senderId: sender._id,
      displayImage: sender.profilePic,
      content: newMessage.content,
      timestamp: newMessage.createdAt,
      messageMedia: newMessage.messageMedia || [],
      voiceNote: newMessage.voiceNote || null
    };

    return {
      success: true,
      message: "Message successfully sent",
      data: formattedResponse, // Return the formatted response for the frontend
    };
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      message: "Error sending message",
      error,
    };
  }
});

export { 
  sendMessage, 
  spaceOwnerGetAllChats,
  spaceUserGetAllChats,
  getMessagesForAListing
};

