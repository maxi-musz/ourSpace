import asyncHandler from "../../middleware/asyncHandler.js";
import Listing from "../../models/listingModel.js";
import Message from "../../models/messageModel.js";

const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, content, listingId } = req.body;
    const senderId = req.user._id;
  
    const listing = await Listing.findById(listingId);
    if (!listing) {
      console.log("Listing not found or deleted...".red)
      return res.status(404).json({ success: false, message: 'Listing is no more available' });
    }
  
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.log("User not found...".red)  
      return res.status(404).json({ success: false, message: 'User could not be found again' });
    }
  
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      listing: listingId,
      content,
    });
  
    await message.save();

    // Emitting the message to the room
    const io = req.app.get('socketio');
    io.to(listingId).emit('receiveMessage', message);
  
    console.log("New messsage sent...".magenta)
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
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