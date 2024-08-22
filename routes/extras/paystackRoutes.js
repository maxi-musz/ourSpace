import express from 'express';
import { handleWebhook, initializeTransaction, verifyTransaction } from '../../controllers/extras/paystackController.js';

const router = express.Router();

router.post('/initialize', initializeTransaction);

// Route to handle Paystack webhooks
router.post('/webhook', handleWebhook);

// Route to verify a transaction (for manual verification)
router.get('/verify', verifyTransaction);
export default router;
