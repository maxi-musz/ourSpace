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
  