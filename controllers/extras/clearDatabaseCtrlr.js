import Booking from "../../models/bookingModel";
import Listing from "../../models/listingModel";
import Message from "../../models/messageModel";
import OTP from "../../models/otpModel";
import User from "../../models/userModel";



export const deleteAllData = async (req, res) => {
    try {
      // Delete all documents from each collection
      await Promise.all([
        User.deleteMany({}),
        Booking.deleteMany({}),
        Listing.deleteMany({}),
        Message.deleteMany({}),
        Notification.deleteMany({})
      ]);
  
      return res.status(200).json({ message: 'All data deleted successfully!' });
    } catch (error) {
      console.error('Error deleting data:', error);
      return res.status(500).json({ message: 'An error occurred while deleting data.' });
    }
  };