import asyncHandler from "../../middleware/asyncHandler";
import Withdrawal from "../../models/withdrawalRequestModel";

export const getPendingWithdrawals = asyncHandler(async (req, res) => {
    console.log("Admin getting all withdrawals".blue)
    try {
        const pendingWithdrawals = await Withdrawal.find({ paystack_status: 'otp' }).populate('user', 'email'); // Fetch pending withdrawals with user details
        
        console.log("All withdrawals retrieved".rainbow)
        return res.status(200).json({
            success: true,
            message: "Pending withdrawals fetched successfully",
            withdrawals: pendingWithdrawals
        });
    } catch (error) {
        console.error("Error fetching pending withdrawals", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching pending withdrawals",
        });
    }
});

export const approveWithdrawal = asyncHandler(async (req, res) => {
    console.log("Admin approving withdrawal".rainbow)

    const { otp, withdrawalId } = req.body;

    try {
        const withdrawal = await Withdrawal.findById(withdrawalId);

        if (!withdrawal || withdrawal.paystack_status !== 'otp') {
            return res.status(400).json({
                success: false,
                message: 'Invalid or already processed withdrawal',
            });
        }

        // // Store the OTP in the withdrawal object
        withdrawal.otp = otp;

        // Communicate with Paystack to approve the transfer
        const response = await axios.post(
            `https://api.paystack.co/transfer/finalize_transfer`,
            {
                transfer_code: withdrawal.transfer_code, // The transfer code from Paystack
                otp, 
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
                },
            }
        );

        const { status, message } = response.data;

        console.log("Response", response.data)

        if (status) {
            withdrawal.status = 'completed';
            withdrawal.paystack_status = 'completed'
            // withdrawal.otp_verified = true;
            await withdrawal.save();

            return res.status(200).json({
                success: true,
                message: "Withdrawal approved and funds transferred",
                data: withdrawal,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to approve withdrawal with Paystack",
            });
        }
    } catch (error) {
        console.error("Error approving withdrawal", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while approving withdrawal",
        });
    }
});

