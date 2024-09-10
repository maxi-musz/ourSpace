import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: [true, "Email has already subscribed to newsletter"]
    }
}, {
    timestamps: true
})

const Newsletter = mongoose.model("Newsletter", newsletterSchema)

export default Newsletter;