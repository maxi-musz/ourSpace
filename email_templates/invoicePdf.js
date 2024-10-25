export const generateBookingPDFHtml = (bookingData) => {
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
            .invoice-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .invoice-header {
                text-align: center;
                background-color: #342fc4;
                color: white;
                padding: 10px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            .invoice-body {
                padding: 20px;
                line-height: 1.6;
                color: #555;
            }
            .invoice-footer {
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
            ul {
                list-style-type: none;
                padding: 0;
            }
            li {
                margin: 5px 0;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="invoice-header">
                <h2>Booking Invoice</h2>
            </div>
            <div class="invoice-body">
                <p>Find below the booking details!</p>
                <p><span class="highlight">Booking Details:</span></p>
                <ul>
                    <li><strong>Invoice ID:</strong> ${bookingData.invoiceId}</li>
                    <li><strong>property User:</strong> ${bookingData.propertyUserName}</li>
                    <li><strong>property Name:</strong> ${bookingData.propertyName}</li>
                    <li><strong>Date:</strong> ${bookingData.date}</li>
                    <li><strong>Description:</strong> ${bookingData.description}</li>
                    <li><strong>Amount:</strong> ${bookingData.amount}</li>
                </ul>
                <p>If you have any questions, please contact us.</p>
                <a href="https://exploreourspace.com" class="cta-button">View Booking Details</a>
            </div>
            <div class="invoice-footer">
                <p>&copy; 2024 ourspace. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const generateWithdrawalPDFHtml = (withdrawalData) => {
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
            .invoice-container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .invoice-header {
                text-align: center;
                background-color: #342fc4;
                color: white;
                padding: 10px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
            }
            .invoice-body {
                padding: 20px;
                line-height: 1.6;
                color: #555;
            }
            .invoice-footer {
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
            ul {
                list-style-type: none;
                padding: 0;
            }
            li {
                margin: 5px 0;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="invoice-header">
                <h2>Booking Invoice</h2>
            </div>
            <div class="invoice-body">
                <p>Find below your withdrawal request details!</p>
                <p><span class="highlight">Withdrawal request Details:</span></p>
                <ul>
                    <li><strong>Invoice ID:</strong> ${withdrawalData.invoiceId}</li>
                    <li><strong>Date:</strong> ${withdrawalData.date}</li>
                    <li><strong>Description:</strong> ${withdrawalData.description}</li>
                    <li><strong>Amount:</strong> ${withdrawalData.amount}</li>
                    <li><strong>Status:</strong> ${withdrawalData.status}</li>
                </ul>
                <p>If you have any questions, please contact us.</p>
                <a href="https://exploreourspace.com" class="cta-button">View Booking Details</a>
            </div>
            <div class="invoice-footer">
                <p>&copy; 2024 ourspace. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
