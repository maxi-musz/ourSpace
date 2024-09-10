import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },

    title: {
        type: String,
        required: true
    },
    subTitle: {
        type: String,
        required: true 
    },
    displayImage: {
        type: String
    }
},{
    timestamps : true
})

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;