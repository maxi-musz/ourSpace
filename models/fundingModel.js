import mongoose from "mongoose";

const walletFundingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount_to_fund: { type: Number, required: true},
    payment_status: { 
        type: String,
        enum: ["pending", "failed", "successful"],
        default: "pending",
        required: true
     },
     current_balance_before_funding: { type: Number, required: true },
     current_balance_after_funding: {type: Number, required: true},
     all_time_wallet_funding: { type: Number, required: true },
     authorization_url: { type: String, required: true },
     access_code: { type: String, required: true },
     paystack_ref: { type: String, required: true}
})

const FundingHistory = mongoose.model("FundingHistory", walletFundingSchema)

export default FundingHistory;