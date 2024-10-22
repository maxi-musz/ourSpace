import mongoose from 'mongoose';

// Bank schema to represent each bank account the user adds
const bankSchema = new mongoose.Schema({
    bank_name: { type: String, required: true },  // Bank name (e.g., "First Bank")
    bank_code: { type: String, required: true },  // Bank code (e.g., "011")
    account_number: { type: String, required: true },  // Bank account number
    account_name: { type: String, required: true },  // Name on the bank account
    recipient_code: { type: String, required: true },  // Paystack recipient code
});

// Main BankDetails schema, referencing the user and holding an array of bank accounts
const bankDetailsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    banks: [bankSchema],  
}, {
    timestamps: true,
});

const BankDetails = mongoose.model('BankDetails', bankDetailsSchema);

export default BankDetails;
