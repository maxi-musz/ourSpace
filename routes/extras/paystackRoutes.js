import express from 'express';
import { handleWebhook, initializeTransaction, verifyTransaction } from '../../controllers/extras/paystackController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/initialize').post(protect, initializeTransaction);

// Route to handle Paystack webhooks
router.post('/webhook', handleWebhook);

// Route to verify a transaction (for manual verification)
router.post('/verify', verifyTransaction);
export default router;
