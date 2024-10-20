import pdf from 'html-pdf';
import { generateBookingPDFHtml } from "../email_templates/invoicePdf.js";


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
  
// Function to format the amount with commas
export const formatAmount = (amount) => {
return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const generateBookingInvoicePDF = (req, res) => {
    const bookingData = {
        invoiceId: "#32711325",
        date: "Oct 12, 2024, 8:25 PM",
        description: "OS856738 - James court (Room 12b)",
        amount: "#500,000"
    };

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

  
  