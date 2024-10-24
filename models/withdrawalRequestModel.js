import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, 
    paystack_id: { 
        type: String, 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    }, 
    recipient_code: { 
        type: String, 
        required: true 
    },
    transfer_code: { 
        type: String 
    }, 
    reference: { 
        type: String, 
        required: true 
    },
    source: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        default: 'pending', 
    },
    transfer_success_id: { 
        type: String, 
        default: 'pending', 
    },
    transfer_id: { 
        type: String, 
        default: 'pending', 
    },
    transfer_trials: { 
        type: String, 
        default: 'pending', 
    },
    reason: { 
        type: String, 
        default: 'Withdrawal from wallet' 
    },
    failures: { 
        type: String 
    },
    paystack_createdAt: { 
        type: Date, 
        default: Date.now 
    },
    paystack_updatedAt: { 
        type: Date 
    }
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;
