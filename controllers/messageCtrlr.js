import asyncHandler from "../middleware/asyncHandler.js";
import Booking from "../models/bookingModel.js";
import Listing from "../models/listingModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import cloudinaryConfig from "../uploadUtils/cloudinaryConfig.js";

                                                                        // Cloudinary upload for pictures videos and voicenotes
const uploadMessageMediaToCloudinary = async (item, isAudio = false) => {
  try {
    // Check if the item is a URL (already uploaded media)
    if (typeof item === 'string' && item.startsWith('http')) {
      return { secure_url: item, public_id: null };
    } else {
      let uploadItem = item;

      // If it's an audio file in base64 format, strip the data URL prefix
      if (isAudio && typeof item === 'string' && item.startsWith('data:audio')) {
        uploadItem = item.split(',')[1]; // Remove the 'data:audio/mp3;base64,' prefix
        uploadItem = `data:audio/mp3;base64,${uploadItem}`; // Rebuild the valid base64 string
      }

      // Set Cloudinary options with correct resource type
      const uploadOptions = {
        folder: isAudio ? 'ourSpace/message-voice-notes' : 'ourSpace/message-media',
        resource_type: isAudio ? 'video' : 'image' // Explicitly set resource type for audio
      };

      const result = await cloudinaryConfig.uploader.upload(uploadItem, uploadOptions);

      return {
        secure_url: result.secure_url,
        public_id: result.public_id
      };
    }
  } catch (error) {
    console.error("Error during Cloudinary upload:", error); // Log the full error details
    throw new Error("Cloudinary upload failed: " + error.message);
  }
};

const getLatestMessagesForChats = async (listingIds, currentUserId) => {
  return await Message.aggregate([
    { $match: { listing: { $in: listingIds } } },
    { $sort: { createdAt: -1 } }, 
    {
      $group: {
        _id: {
          listing: "$listing",
          otherUserId: { $cond: [{ $eq: ["$sender", currentUserId] }, "$receiver", "$sender"] }
        },
        lastMessageContent: { $first: "$content" },
        lastMessageTimestamp: { $first: "$createdAt" },
        messageMedia: { $first: "$messageMedia" }, // Include messageMedia
        voiceNote: { $first: "$voiceNote" } // Include voiceNote
      }
    },
    {
      $lookup: {
        from: "users", 
        localField: "_id.otherUserId",
        foreignField: "_id",
        as: "propertyUser"
      }
    },
    { $unwind: "$propertyUser" },
    {
      $lookup: {
        from: "listings",
        localField: "_id.listing",
        foreignField: "_id",
        as: "listingDetails"
      }
    },
    { $unwind: "$listingDetails" },
    {
      $project: {
        listing: "$_id.listing",
        lastMessageContent: 1,
        lastMessageTimestamp: 1,
        messageMedia: 1, 
        voiceNote: 1,   
        propertyUser: {
          id: "$propertyUser._id",
          name: { $concat: ["$propertyUser.firstName", " ", "$propertyUser.lastName"] },
          profilePic: "$propertyUser.profilePic"
        },
        listing: {
          id: "$listingDetails._id",
          propertyName: "$listingDetails.propertyName",
          bedroomPictures: "$listingDetails.bedroomPictures"
        }
      }
    }
  ]);
};

//                                  get all chats for space owners
const spaceOwnerGetAllChats = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Ensure the user is a space owner
    if (req.user.userType !== "space-owner") {
      return res.status(403).json({
        success: false,
        message: "Only space owners are allowed"
      });
    }

    // Find all listings owned by the current space owner
    const listings = await Listing.find({ user: currentUserId }).select('_id');
    const listingIds = listings.map(listing => listing._id);

    // Get the latest messages for the listings
    const latestMessages = await getLatestMessagesForChats(listingIds, currentUserId);

    // Initialize an array to hold the final response data
    const result = latestMessages.map(message => {
      // Check if lastMessageContent is empty and if there's media or voice notes
      const hasMedia = (message.messageMedia && message.messageMedia.length > 0) || 
                       (message.voiceNote && message.voiceNote.length > 0);
      const lastMessageContent = message.lastMessageContent || (hasMedia ? "new media file received" : '');

      return {
        propertyOwner: {
          id: currentUserId,
          name: req.user.firstName + " " + req.user.lastName,
          profilePic: req.user.profilePic
        },
        propertyUser: {
          id: message.propertyUser.id,
          name: message.propertyUser.name,
          profilePic: message.propertyUser.profilePic
        },
        property: {
          id: message.listing.id,
          name: message.listing.propertyName,
          image: message.listing.bedroomPictures ? message.listing.bedroomPictures[0] : '' // First image
        },
        lastMessageContent: lastMessageContent,
        lastMessageTimestamp: message.lastMessageTimestamp || Date.now()
      };
    });

    return res.status(200).json({
      success: true,
      message: "All messages retrieved successfully",
      total: result.length,
      data: result
    });
  } catch (error) {
    console.error("Error getting all chats for space owner", error);
    return res.status(500).json({
      success: false,
      message: "Error getting all chats for space owner"
    });
  }
};

//                                  get all chats for space users
const spaceUserGetAllChats = async (req, res) => {
  console.log("Space user get all chats".yellow);

  try {
    const currentUserId = req.user._id;
    const userType = req.user.userType;

    if (userType !== "space-user") {
      console.log("Only space users are allowed".red);
      return res.status(403).json({
        success: false,
        message: "Only space users are allowed"
      });
    }

    // Find all messages where the user is either the sender or the receiver
    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { receiver: currentUserId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            listing: "$listing",
            otherUserId: { $cond: [{ $eq: ["$sender", currentUserId] }, "$receiver", "$sender"] }
          },
          lastMessageContent: { $first: "$content" },
          lastMessageTimestamp: { $first: "$createdAt" },
          messageMedia: { $first: "$messageMedia" }, // Include messageMedia
          voiceNote: { $first: "$voiceNote" } // Include voiceNote
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.otherUserId",
          foreignField: "_id",
          as: "propertyUser"
        }
      },
      { $unwind: "$propertyUser" },
      {
        $lookup: {
          from: "listings",
          localField: "_id.listing",
          foreignField: "_id",
          as: "listingDetails"
        }
      },
      { $unwind: "$listingDetails" },
      {
        $lookup: {
          from: "users",
          localField: "listingDetails.user",
          foreignField: "_id",
          as: "propertyOwner"
        }
      },
      { $unwind: "$propertyOwner" },
      {
        $project: {
          propertyOwner: {
            id: "$propertyOwner._id",
            name: { $concat: ["$propertyOwner.firstName", " ", "$propertyOwner.lastName"] },
            profilePic: { $ifNull: ["$propertyOwner.profilePic", ""] }
          },
          propertyUser: {
            id: currentUserId,
            name: req.user.firstName + " " + req.user.lastName,
            profilePic: req.user.profilePic
          },
          property: {
            id: "$listingDetails._id",
            name: "$listingDetails.propertyName",
            image: { $arrayElemAt: ["$listingDetails.bedroomPictures", 0] } // First image
          },
          lastMessageContent: {
            $cond: [
              { $and: [{ $eq: ["$lastMessageContent", ""] }, { $or: [{ $ne: ["$messageMedia", []] }, { $ne: ["$voiceNote", []] }] }] },
              "New media file received",
              "$lastMessageContent"
            ]
          },
          lastMessageTimestamp: "$lastMessageTimestamp"
        }
      }
    ]);

    console.log("All messages for space user retrieved".green);

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      total: latestMessages.length,
      data: latestMessages
    });
  } catch (error) {
    console.error("Error getting all chats for space users", error);
    return res.status(500).json({
      success: false,
      message: "Error getting all chats for space users",
      error
    });
  }
};

const getMessagesForAListing = asyncHandler(async (data) => {
  try {
    const {currentUserId, listingId, otherUserId } = data;

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
        voiceNote: message.voiceNote
      })),
    };
  } catch (error) {
    console.log("Something went wrong", error);
    return { success: false, message: "Something went wrong", error };
  }
});

//                                 send message
const sendMessage = asyncHandler(async (data) => {
  console.log("Sending a new message".cyan);

  try {
    const { senderId, listingId, content, receiverId, messageMedia, voiceNote } = data;

    // Fetching receiver and listing details
    const receiverUser = await User.findById(receiverId);
    const propertyListing = await Listing.findById(listingId);
    const sender = await User.findById(senderId)


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

    if (!sender) {
      console.log("User does not exist or account has been suspended or deleted".bgRed);
      return {
        success: false,
        message: "User does not exist or account has been suspended or deleted",
      };
    }

    let uploadedMedia = null;

    // Upload message media if it exists
    if (messageMedia) {
      console.log("Processing uploaded media file".cyan);
      uploadedMedia = await uploadMessageMediaToCloudinary(messageMedia);
      console.log("Media uploaded to Cloudinary".green);
    }

    let voiceNoteMedia = null;
    if (voiceNote) {
      console.log("Processing voice note file".cyan);
      try {
        voiceNoteMedia = await uploadMessageMediaToCloudinary(voiceNote, true); // Pass true for audio
        console.log("Voice note uploaded to Cloudinary".green);
      } catch (error) {
        console.error("Error uploading voice note:", error); // Log the error for voice note
        return { success: false, message: "Error uploading voice note" };
      }
    }


    // Create and save the message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverUser._id,
      listing: propertyListing._id,
      content,
      messageMedia: uploadedMedia ? [uploadedMedia] : [],
      voiceNote: voiceNoteMedia ? [voiceNoteMedia] : [],
    });

    await newMessage.save();

    // Create response in the structure needed by the frontend
    const formattedResponse = {
      senderId: senderId,
      displayImage: sender.profilePic,
      content: newMessage.content,
      timestamp: newMessage.createdAt,
      messageMedia: newMessage.messageMedia || [],
      voiceNote: newMessage.voiceNote || []
    };

    return formattedResponse
  } catch (error) {
    console.error("Error sending message:", error);
    return {
      success: false,
      message: "Error sending message",
      error,
    };
  }
});

const postmanSendMessage = asyncHandler(async (req, res) => {
  console.log("Sending a new message".green);

  const data = req.body;

  try {
    const {listingId, content, receiverId} = data;

    // Fetching receiver and listing details
    const receiverUser = await User.findById(receiverId);
    const propertyListing = await Listing.findById(listingId);

    // Validate listing and receiver
    if (!propertyListing) {
      console.log("This listing isn't available again or has been deleted by the owner".bgRed);
      return res.status(404).json({
        success: false,
        message: "This listing isn't available again or has been deleted by the owner",
      });
    }

    if (!receiverUser) {
      console.log("User does not exist or account has been suspended or deleted".bgRed);
      return res.status(404).json({
        success: false,
        message: "User does not exist or account has been suspended or deleted",
      });
    }

    let uploadedMedia = null;

    // Upload message media if it exists
    if (req.file) {
      console.log("Processing uploaded media file".cyan);
      uploadedMedia = await uploadMessageMedia(req.file);
      console.log("Media uploaded to Cloudinary".green);
    }

    let voiceNoteMedia = null;
    if (req.voiceNote) {
      console.log("Processing voice note file".cyan);
      try {
        voiceNoteMedia = await uploadMessageMedia(voiceNote, true); // Pass true for audio
        console.log("Voice note uploaded to Cloudinary".green);
      } catch (error) {
        console.error("Error uploading voice note:", error); // Log the error for voice note
        return res.status(500).json({
          success: false,
          message: "Error uploading voice note",
          error: error.message,
        });
      }
    }

    // Create and save the message
    const newMessage = new Message({
      sender: req.user._id,
      receiver: receiverUser._id,
      listing: propertyListing._id,
      content,
      messageMedia: uploadedMedia ? [uploadedMedia] : [],
      voiceNote: voiceNoteMedia ? [voiceNoteMedia] : [],
    });

    await newMessage.save();

    // Create response in the structure needed by the frontend
    const formattedResponse = {
      senderId: req.user._id,
      displayImage: req.user.profilePic,
      content: newMessage.content,
      timestamp: newMessage.createdAt,
      messageMedia: newMessage.messageMedia || [],
      voiceNote: newMessage.voiceNote || [],
    };

    // Send a success response with the formatted data
    console.log("New message successfully sesaved to db".magenta)
    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: formattedResponse,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
});


export { 
  sendMessage, 
  spaceOwnerGetAllChats,
  spaceUserGetAllChats,
  getMessagesForAListing,
  postmanSendMessage
};

