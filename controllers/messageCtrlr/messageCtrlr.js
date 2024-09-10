import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js";
import Message from "../../models/messageModel.js";

const sendMessage = asyncHandler(async (req, res) => {
  try {
    const { sender, receiver, listing, content, media } = req.body;
    
    const senderUser = await User.findById(sender);
    const receiverUser = await User.findById(receiver);
    const propertyListing = listing ? await Listing.findById(listing) : null;

    if (!senderUser || !receiverUser || (listing && !propertyListing)) {
      return res.status(400).json({ message: 'Invalid sender, receiver, or listing' });
    }

    let mediaUrl = null;
    if (media) {
      const result = await uploadToCloudinary(media); // Upload media
      mediaUrl = result.secure_url;
    }

    const message = new Message({ sender, receiver, listing, content, media: mediaUrl });
    await message.save();

    // Emit event to notify the receiver
    req.io.to(receiver).emit('new_message', message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
  
// Get messages for a listing
const getMessages = asyncHandler(async (req, res) => {
    const { listingId } = req.params;
  
    const messages = await Message.find({ listing: listingId })
      .populate('sender', 'firstName lastName')
      .populate('receiver', 'firstName lastName')
      .sort('timestamp');
  
    if (!messages.length) {
      return res.status(404).json({ success: false, message: 'No messages found' });
    }
  
    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: messages,
    });
});

export { sendMessage, getMessages };