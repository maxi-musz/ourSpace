import pdf from 'html-pdf';
import { generateBookingPDFHtml, generateWithdrawalPDFHtml } from "../email_templates/invoicePdf.js";


// Function to format the date
export const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',  // e.g. "Aug"
      day: 'numeric',  // e.g. "16"
      year: 'numeric', // e.g. "2022"
      hour: 'numeric',  // e.g. "10"
      minute: 'numeric', // e.g. "23"
      hour12: true  // e.g. "10:23 AM"
    });
};

export const formatDateWithoutTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',  // e.g. "Aug"
      day: 'numeric',  // e.g. "16"
      weekday: 'short' // e.g "Wed"
      // year: 'numeric', // Uncomment if you want to include the year
      // hour: 'numeric',  // Remove these lines to exclude time
      // minute: 'numeric', // Remove these lines to exclude time
      // hour12: true // Remove this line if you don't want AM/PM
    });
};
  
// Function to format the amount with commas
export const formatAmount = (amount) => {
return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const generateBookingInvoicePDF = (bookingData, res) => {

    const html = generateBookingPDFHtml(bookingData);

    const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm"
        }
    };

    pdf.create(html, options).toFile(`./invoices/invoice-${bookingData.invoiceId}.pdf`, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error creating PDF' });
        }
        res.download(result.filename); // Automatically download the generated PDF
    });
};

export const generateWithdrawalInvoicePDF = (withdrawalData, res) => {

    const html = generateWithdrawalPDFHtml(withdrawalData);

    const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm"
        }
    };

    pdf.create(html, options).toFile(`./invoices/invoice-${withdrawalData.invoiceId}.pdf`, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error creating PDF' });
        }
        res.download(result.filename); // Automatically download the generated PDF
    });
};

  
  