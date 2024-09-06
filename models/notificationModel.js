import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Listing',
    },

    title: {
        type: String,
        required: true
    },
    subTitle: {
        type: String,
        required: true
    },
},{
    timestamps : true
})

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;