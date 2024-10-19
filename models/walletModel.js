import mongoose, { mongo } from "mongoose";

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    totalWithdrawn: {
        type: Number,
        default: 0
    },
    totalEarned: {
        type: Number,
        default: 0
    }
})

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet
