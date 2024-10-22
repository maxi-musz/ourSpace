export const listingRejectedEmail = async (fullName, listingName, rejectionDate, rejectionReason) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
                color: #333;
            }
            .email-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                text-align: center;
                background-color: #342fc4;
                color: white;
                padding: 10px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            .email-body {
                padding: 20px;
                line-height: 1.6;
                color: #555;
            }
            .email-footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #777;
            }
            .highlight {
                color: #342fc4;
                font-weight: bold;
            }
            .cta-button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background-color: #342fc4;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h2>Listing Submission Update</h2>
            </div>
            <div class="email-body">
                <p>Dear ${fullName},</p>
                <p>Thank you for submitting your listing titled <span class="highlight">${listingName}</span> for review.</p>
                <p>Unfortunately, we regret to inform you that your listing was <span class="highlight">not approved</span> as of <span class="highlight">${rejectionDate}</span>.</p>
                <p><strong>Reason for Rejection:</strong> ${rejectionReason}</p>
                <p>We encourage you to review the guidelines and make any necessary adjustments. Once you're ready, you can resubmit your listing for review.</p>
                <p>If you have any questions or need further clarification, feel free to <a href="mailto:ourspacegloballtd@gmail.com">contact our support team</a>.</p>
                <a href="https://exploreourspace.com" class="cta-button">View Submission Guidelines</a>
            </div>
            <div class="email-footer">
                <p>Thank you for your understanding. We look forward to seeing your updated submission!</p>
                <p>&copy; 2024 ourspace. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
